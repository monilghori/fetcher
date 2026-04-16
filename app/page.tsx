'use client';

import { useEffect, useState } from 'react';
import StatusBadge from '@/components/StatusBadge';
import TickTable from '@/components/TickTable';
import LTPChart from '@/components/LTPChart';
import CountdownTimer from '@/components/CountdownTimer';
import { Nifty50Tick } from '@/lib/types';
import { formatISTTime, getISTTime } from '@/lib/time';

interface StatusData {
  isWithinWindow: boolean;
  currentTime: string;
  nextWindowStart: string;
  nextWindowStartTimestamp?: number; // Timestamp for client-side countdown
  secondsUntilWindow: number;
  todayTickCount: number;
}

export default function Dashboard() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [ticks, setTicks] = useState<Nifty50Tick[]>([]);
  const [latestTick, setLatestTick] = useState<Nifty50Tick | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [autoPollingEnabled, setAutoPollingEnabled] = useState(true); // Manual control for auto-polling
  const [lastFetchError, setLastFetchError] = useState<string | null>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testProgress, setTestProgress] = useState<string>('');
  const [testAbortController, setTestAbortController] = useState<AbortController | null>(null);
  const [testTicksCollected, setTestTicksCollected] = useState(0);
  const [errorDetails, setErrorDetails] = useState<{type: string; message: string} | null>(null);
  const [dailySummaries, setDailySummaries] = useState<any[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [dateTicksMap, setDateTicksMap] = useState<Map<string, Nifty50Tick[]>>(new Map());
  const [clientSecondsUntilWindow, setClientSecondsUntilWindow] = useState<number>(0); // Client-side countdown
  
  // Fetch status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Status fetch failed:', errorData);
        setErrorDetails({
          type: 'status',
          message: errorData.message || 'Failed to fetch system status'
        });
        return;
      }
      
      const data = await res.json();
      setStatus(data);
      setErrorDetails(null); // Clear error on success
    } catch (error: any) {
      console.error('Failed to fetch status:', error);
      setErrorDetails({
        type: 'status',
        message: 'Unable to connect to server. Please check your connection.'
      });
    }
  };
  
  // Fetch available dates with summaries
  const fetchAvailableDates = async () => {
    try {
      const res = await fetch('/api/daily-summary');
      if (res.ok) {
        const data = await res.json();
        setDailySummaries(data.summaries || []);
      }
    } catch (error) {
      console.error('Failed to fetch available dates:', error);
    }
  };
  
  // Fetch ticks for today (for live display)
  const fetchTodayTicks = async () => {
    try {
      const today = formatISTTime(getISTTime(), 'yyyy-MM-dd');
      const url = `/api/ticks?date=${today}`;
      
      const res = await fetch(url);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ Ticks fetch failed:', errorData);
        return;
      }
      
      const data = await res.json();
      
      setTicks(data.ticks || []);
      if (data.ticks && data.ticks.length > 0) {
        setLatestTick(data.ticks[0]);
      }
    } catch (error: any) {
      console.error('💥 Failed to fetch ticks:', error);
    }
  };
  
  // Toggle day expansion and fetch ticks if needed
  const toggleDayExpansion = async (date: string) => {
    const newExpandedDates = new Set(expandedDates);
    
    if (expandedDates.has(date)) {
      // Collapse
      console.log('📁 Collapsing date:', date);
      newExpandedDates.delete(date);
      setExpandedDates(newExpandedDates);
    } else {
      // Expand
      console.log('📂 Expanding date:', date);
      newExpandedDates.add(date);
      setExpandedDates(newExpandedDates);
      
      // Always fetch ticks (even if cached) to get latest data
      try {
        console.log('📡 Fetching ticks for date:', date);
        const res = await fetch(`/api/ticks?date=${date}`);
        if (res.ok) {
          const data = await res.json();
          console.log('✅ Received', data.count, 'ticks for', date);
          console.log('📊 Sample ticks:', data.ticks?.slice(0, 3));
          const newMap = new Map(dateTicksMap);
          newMap.set(date, data.ticks || []);
          setDateTicksMap(newMap);
          console.log('💾 Stored', data.ticks?.length || 0, 'ticks in state');
        } else {
          console.error('❌ Failed to fetch ticks:', res.status, res.statusText);
        }
      } catch (error) {
        console.error('💥 Failed to fetch ticks for date:', date, error);
      }
    }
  };
  
  // Manual fetch tick
  const handleFetchNow = async () => {
    if (!status?.isWithinWindow) {
      setLastFetchError('Can only fetch during collection window (14:55-15:05 IST, Mon-Fri)');
      setTimeout(() => setLastFetchError(null), 5000);
      return;
    }
    
    try {
      setLastFetchError(null);
      const res = await fetch('/api/fetch-tick', {
        method: 'POST',
        headers: {
          'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET || ''
        }
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        let errorMsg = 'Failed to fetch data';
        
        if (res.status === 401) {
          errorMsg = 'Authentication failed. Check CRON_SECRET configuration.';
        } else if (res.status === 500) {
          if (data.message?.includes('Dhan API')) {
            errorMsg = 'Dhan API error. Check your API credentials.';
          } else if (data.message?.includes('Database')) {
            errorMsg = 'Database error. Check Supabase connection.';
          } else {
            errorMsg = data.message || 'Server error occurred';
          }
        } else {
          errorMsg = data.message || data.error || errorMsg;
        }
        
        setLastFetchError(errorMsg);
        setTimeout(() => setLastFetchError(null), 8000);
        return;
      }
      
      // Refresh today's ticks
      await fetchTodayTicks();
      setLastFetchError(null);
    } catch (error: any) {
      let errorMsg = 'Network error. Please check your connection.';
      
      if (error.message?.includes('fetch')) {
        errorMsg = 'Unable to reach server. Is the app running?';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setLastFetchError(errorMsg);
      setTimeout(() => setLastFetchError(null), 8000);
      console.error('Failed to fetch tick:', error);
    }
  };
  
  // Test mode - collect data for 1 minute
  const handleTestCollect = async () => {
    if (isTestRunning) return;
    
    const confirmed = confirm(
      'This will collect Nifty 50 data every 3 seconds for 1 minute (about 20 ticks).\n\n' +
      'You can see the collected data in the history table below.\n\n' +
      'Continue?'
    );
    
    if (!confirmed) return;
    
    setIsTestRunning(true);
    setTestProgress('Starting test collection...');
    setLastFetchError(null);
    setTestTicksCollected(0);
    
    const abortController = new AbortController();
    setTestAbortController(abortController);
    
    const startTime = Date.now();
    const duration = 60 * 1000; // 60 seconds
    let tickCount = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;
    
    console.log('🧪 TEST MODE STARTED');
    console.log('Duration:', duration / 1000, 'seconds');
    console.log('Expected ticks:', Math.floor(duration / 3000));
    
    try {
      while (Date.now() - startTime < duration && !abortController.signal.aborted) {
        const attemptNumber = tickCount + consecutiveErrors + 1;
        console.log(`\n📡 Attempt #${attemptNumber} - Fetching tick...`);
        
        try {
          // Fetch single tick
          const quoteRes = await fetch('/api/fetch-tick', {
            method: 'POST',
            headers: {
              'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET || '',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ testMode: true }),
            signal: abortController.signal
          });
          
          console.log('Response status:', quoteRes.status, quoteRes.statusText);
          
          const responseData = await quoteRes.json();
          console.log('Response data:', responseData);
          
          if (!quoteRes.ok) {
            consecutiveErrors++;
            const errorData = responseData;
            
            let errorMsg = 'Fetch failed';
            if (quoteRes.status === 401) {
              errorMsg = 'Authentication error. Check CRON_SECRET in .env.local';
              console.error('❌ AUTH ERROR:', errorData);
              setLastFetchError(errorMsg);
              break; // Stop on auth error
            } else if (quoteRes.status === 500) {
              if (errorData.message?.includes('Dhan API')) {
                errorMsg = 'Dhan API error. Check DHAN_ACCESS_TOKEN and DHAN_CLIENT_ID';
              } else if (errorData.message?.includes('Database')) {
                errorMsg = 'Database error. Check Supabase configuration';
              } else {
                errorMsg = errorData.message || 'Server error';
              }
              console.error('❌ SERVER ERROR:', errorData);
            }
            
            console.error('Tick fetch error:', errorMsg, errorData);
            
            // Stop if too many consecutive errors
            if (consecutiveErrors >= maxConsecutiveErrors) {
              setLastFetchError(`${errorMsg}. Stopped after ${maxConsecutiveErrors} consecutive failures.`);
              console.error('🛑 STOPPING: Too many consecutive errors');
              break;
            }
            
            setLastFetchError(`${errorMsg} (attempt ${consecutiveErrors}/${maxConsecutiveErrors})`);
          } else {
            consecutiveErrors = 0; // Reset on success
            tickCount++;
            setTestTicksCollected(tickCount);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = 60 - elapsed;
            setTestProgress(`Collecting... ${tickCount} ticks (${remaining}s remaining)`);
            setLastFetchError(null);
            
            console.log('✅ SUCCESS! Tick #' + tickCount + ' saved');
            console.log('Tick data:', responseData.tick);
            
            // Refresh today's ticks display
            await fetchTodayTicks();
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.log('⚠️ Aborted by user');
            break;
          }
          
          consecutiveErrors++;
          let errorMsg = 'Network error';
          
          if (error.message?.includes('fetch')) {
            errorMsg = 'Cannot reach server. Is the app running?';
          } else if (error.message?.includes('timeout')) {
            errorMsg = 'Request timeout. Server may be slow.';
          } else if (error.message) {
            errorMsg = error.message;
          }
          
          console.error('❌ EXCEPTION:', error);
          
          // Stop if too many consecutive errors
          if (consecutiveErrors >= maxConsecutiveErrors) {
            setLastFetchError(`${errorMsg}. Stopped after ${maxConsecutiveErrors} consecutive failures.`);
            console.error('🛑 STOPPING: Too many consecutive errors');
            break;
          }
          
          setLastFetchError(`${errorMsg} (attempt ${consecutiveErrors}/${maxConsecutiveErrors})`);
        }
        
        // Wait 3 seconds before next fetch
        console.log('⏳ Waiting 3 seconds...');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, 3000);
          abortController.signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new Error('Aborted'));
          });
        }).catch(() => {});
        
        if (abortController.signal.aborted) break;
      }
      
      console.log('\n🏁 TEST COMPLETED');
      console.log('Total ticks collected:', tickCount);
      console.log('Total errors:', consecutiveErrors);
      
      if (abortController.signal.aborted) {
        setTestProgress(`⚠ Test cancelled. Collected ${tickCount} ticks.`);
        setLastFetchError(null);
      } else if (consecutiveErrors >= maxConsecutiveErrors) {
        setTestProgress(`⚠ Test stopped due to errors. Collected ${tickCount} ticks.`);
      } else {
        setTestProgress(`✓ Test completed! Collected ${tickCount} ticks. Check history below.`);
        setLastFetchError(null);
      }
      
      // Wait a moment for database to finish writing
      console.log('⏳ Waiting 500ms for database writes to complete...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh today's ticks and summaries
      console.log('🔄 Refreshing data...');
      await fetchTodayTicks();
      await fetchAvailableDates();
      
      // Auto-expand today's date in Historical Data to show new ticks
      const today = formatISTTime(getISTTime(), 'yyyy-MM-dd');
      console.log('📅 Auto-expanding today:', today);
      const newExpandedDates = new Set(expandedDates);
      newExpandedDates.add(today);
      setExpandedDates(newExpandedDates);
      
      // Fetch and cache today's ticks for the expanded view
      try {
        console.log('📡 Fetching today\'s ticks for history view...');
        const res = await fetch(`/api/ticks?date=${today}`);
        if (res.ok) {
          const data = await res.json();
          console.log('✅ Loaded', data.count, 'ticks for today');
          const newMap = new Map(dateTicksMap);
          newMap.set(today, data.ticks || []);
          setDateTicksMap(newMap);
        } else {
          console.error('❌ Failed to fetch today\'s ticks:', res.status);
        }
      } catch (error) {
        console.error('Failed to fetch today\'s ticks for history:', error);
      }
      
      // Clear message after 8 seconds
      setTimeout(() => {
        setTestProgress('');
        setLastFetchError(null);
      }, 8000);
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        const errorMsg = error.message || 'Unexpected error during test';
        setLastFetchError(errorMsg);
        setTestProgress(`⚠ Test failed. Collected ${tickCount} ticks.`);
        console.error('💥 TEST FAILED:', error);
        
        setTimeout(() => {
          setTestProgress('');
          setLastFetchError(null);
        }, 8000);
      }
    } finally {
      setIsTestRunning(false);
      setTestAbortController(null);
      setTestTicksCollected(0);
    }
  };
  
  // Cancel test collection
  const handleCancelTest = () => {
    if (testAbortController) {
      testAbortController.abort();
    }
  };
  
  // Auto-polling during window
  useEffect(() => {
    // Only auto-poll if within window AND auto-polling is enabled AND not already polling
    if (status?.isWithinWindow && autoPollingEnabled && !isPolling) {
      setIsPolling(true);
      
      console.log('🔄 Starting auto-polling (every 3 seconds)');
      const pollInterval = setInterval(async () => {
        await handleFetchNow();
      }, 3000); // Poll every 3 seconds
      
      return () => {
        console.log('⏸️ Stopping auto-polling');
        clearInterval(pollInterval);
        setIsPolling(false);
      };
    } else if (isPolling && (!status?.isWithinWindow || !autoPollingEnabled)) {
      // Stop polling if window closed or auto-polling disabled
      setIsPolling(false);
    }
  }, [status?.isWithinWindow, autoPollingEnabled]);
  
  // Initial load and periodic refresh
  useEffect(() => {
    fetchStatus();
    fetchAvailableDates();
    fetchTodayTicks();
    
    const statusInterval = setInterval(fetchStatus, 10000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, []);
  
  // Client-side countdown calculator
  useEffect(() => {
    if (!status?.nextWindowStartTimestamp) {
      setClientSecondsUntilWindow(status?.secondsUntilWindow || 0);
      return;
    }
    
    // Calculate initial seconds
    const calculateSeconds = () => {
      const now = Date.now();
      const seconds = Math.floor((status.nextWindowStartTimestamp! - now) / 1000);
      return Math.max(0, seconds);
    };
    
    setClientSecondsUntilWindow(calculateSeconds());
    
    // Update every second
    const countdownInterval = setInterval(() => {
      setClientSecondsUntilWindow(calculateSeconds());
    }, 1000);
    
    return () => clearInterval(countdownInterval);
  }, [status?.nextWindowStartTimestamp]);
  
  // Calculate change percent from opening price (first tick of the day)
  const openingPrice = ticks.length > 0 ? ticks[ticks.length - 1].ltp : 0;
  const changePercent = latestTick && openingPrice > 0 
    ? ((latestTick.ltp - openingPrice) / openingPrice) * 100 
    : 0;
  const isPositive = changePercent >= 0;
  
  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Nifty 50 Data Collector</h1>
          <StatusBadge isActive={status?.isWithinWindow || false} />
        </div>
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Current Time */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-sm text-gray-400 mb-2">Current Time (IST)</div>
            <div className="text-2xl font-mono text-white">
              {status?.currentTime.split(' ')[1] || '--:--:--'}
            </div>
          </div>
          
          {/* Latest LTP */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-sm text-gray-400 mb-2">Latest LTP</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-mono text-white">
                {latestTick ? latestTick.ltp.toFixed(2) : '--'}
              </div>
              {latestTick && (
                <div className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '↑' : '↓'} {Math.abs(changePercent).toFixed(2)}%
                </div>
              )}
            </div>
          </div>
          
          {/* Today's Ticks */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-sm text-gray-400 mb-2">Today's Ticks</div>
            <div className="text-2xl font-mono text-white">
              {status?.todayTickCount || 0}
            </div>
          </div>
          
          {/* Next Window / Countdown */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-sm text-gray-400 mb-2">
              {status?.isWithinWindow ? 'Window Active' : 'Next Window In'}
            </div>
            {status?.isWithinWindow ? (
              <div className="text-2xl font-semibold text-green-400">LIVE</div>
            ) : (
              <CountdownTimer seconds={clientSecondsUntilWindow} />
            )}
          </div>
        </div>
        

        
        {/* Manual Fetch Button */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleFetchNow}
            disabled={!status?.isWithinWindow}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              status?.isWithinWindow
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Fetch Now
          </button>
          
          {/* Auto-Polling Toggle */}
          {status?.isWithinWindow && (
            <button
              onClick={() => setAutoPollingEnabled(!autoPollingEnabled)}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                autoPollingEnabled
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {autoPollingEnabled ? '⏸️ Stop Auto-Polling' : '▶️ Start Auto-Polling'}
            </button>
          )}
          
          {/* Test Mode Button */}
          {!isTestRunning ? (
            <button
              onClick={handleTestCollect}
              className="px-6 py-3 rounded-lg font-semibold transition-colors bg-purple-600 hover:bg-purple-700 text-white"
            >
              🧪 Test Mode (1 min)
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                disabled
                className="px-6 py-3 rounded-lg font-semibold bg-gray-700 text-gray-400 cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Testing... ({testTicksCollected} ticks)
                </span>
              </button>
              <button
                onClick={handleCancelTest}
                className="px-6 py-3 rounded-lg font-semibold transition-colors bg-red-600 hover:bg-red-700 text-white"
              >
                ✕ Cancel
              </button>
            </div>
          )}
          
          {isPolling && autoPollingEnabled && (
            <div className="text-sm text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Auto-polling active (every 3s)
            </div>
          )}
          {!autoPollingEnabled && status?.isWithinWindow && (
            <div className="text-sm text-yellow-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full" />
              Auto-polling paused
            </div>
          )}
          {testProgress && (
            <div className={`text-sm font-semibold ${
              testProgress.includes('✓') ? 'text-green-400' : 
              testProgress.includes('⚠') ? 'text-yellow-400' : 
              'text-blue-400'
            }`}>
              {testProgress}
            </div>
          )}
          {lastFetchError && (
            <div className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded border border-red-800">
              ⚠ {lastFetchError}
            </div>
          )}
          {errorDetails && (
            <div className="w-full bg-orange-900/20 px-4 py-3 rounded-lg border border-orange-800">
              <div className="flex items-start gap-3">
                <span className="text-orange-400 text-xl">⚠</span>
                <div className="flex-1">
                  <div className="text-orange-400 font-semibold mb-1">
                    {errorDetails.type === 'database_setup' ? 'Database Setup Required' : 'System Error'}
                  </div>
                  <div className="text-orange-300 text-sm mb-2">
                    {errorDetails.message}
                  </div>
                  {errorDetails.type === 'database_setup' && (
                    <div className="text-orange-200 text-xs bg-orange-900/30 p-2 rounded mt-2">
                      <div className="font-semibold mb-1">Quick Fix:</div>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Open your Supabase dashboard</li>
                        <li>Go to SQL Editor</li>
                        <li>Copy and run the SQL from <code className="bg-orange-900/50 px-1 rounded">supabase-setup.sql</code></li>
                        <li>Refresh this page</li>
                      </ol>
                      <div className="mt-2">
                        📖 See <code className="bg-orange-900/50 px-1 rounded">SETUP_DATABASE.md</code> for detailed instructions
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Today's LTP Chart</h2>
          <LTPChart ticks={ticks} />
        </div>
        
        {/* Historical Data - Expandable Day List */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Historical Data</h2>
              <p className="text-sm text-gray-400 mt-1">
                Click on any day to expand and view all ticks
              </p>
            </div>
            <button
              onClick={async () => {
                console.log('🔄 Refreshing historical data...');
                
                // Refresh summaries
                await fetchAvailableDates();
                
                // Get today's date
                const today = formatISTTime(getISTTime(), 'yyyy-MM-dd');
                
                // Keep today expanded and refresh its data
                const newExpandedDates = new Set<string>();
                newExpandedDates.add(today);
                setExpandedDates(newExpandedDates);
                
                // Fetch fresh data for today
                try {
                  const res = await fetch(`/api/ticks?date=${today}`);
                  if (res.ok) {
                    const data = await res.json();
                    console.log('✅ Refreshed today\'s data:', data.count, 'ticks');
                    const newMap = new Map<string, any[]>();
                    newMap.set(today, data.ticks || []);
                    setDateTicksMap(newMap);
                  }
                } catch (error) {
                  console.error('Failed to refresh today\'s ticks:', error);
                }
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>
          
          {dailySummaries.length > 0 ? (
            <div className="space-y-2">
              {dailySummaries.map((summary) => {
                const isExpanded = expandedDates.has(summary.date);
                const dayTicks = dateTicksMap.get(summary.date) || [];
                
                return (
                  <div key={summary.date} className="border border-gray-700 rounded-lg overflow-hidden">
                    {/* Day Header - Clickable */}
                    <button
                      onClick={() => toggleDayExpansion(summary.date)}
                      className="w-full bg-gray-700 hover:bg-gray-600 transition-colors p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                          <span className="text-gray-400 text-xl">▶</span>
                        </div>
                        <div className="text-left">
                          <div className="text-white font-semibold">
                            {new Date(summary.date + 'T00:00:00').toLocaleDateString('en-IN', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {summary.tick_count} ticks collected
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs text-gray-400">High</div>
                          <div className="text-green-400 font-mono font-semibold">
                            {summary.high_ltp?.toFixed(2) || '-'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">Low</div>
                          <div className="text-red-400 font-mono font-semibold">
                            {summary.low_ltp?.toFixed(2) || '-'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">Open</div>
                          <div className="text-blue-400 font-mono font-semibold">
                            {summary.opening_ltp?.toFixed(2) || '-'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">Close</div>
                          <div className="text-purple-400 font-mono font-semibold">
                            {summary.closing_ltp?.toFixed(2) || '-'}
                          </div>
                        </div>
                      </div>
                    </button>
                    
                    {/* Expanded Content - Ticks Table */}
                    {isExpanded && (
                      <div className="bg-gray-900 p-4">
                        {dayTicks.length > 0 ? (
                          <>
                            <div className="mb-3 text-sm text-gray-400 flex items-center justify-between">
                              <span>Showing {dayTicks.length} ticks (scroll to see all)</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDayExpansion(summary.date);
                                }}
                                className="text-blue-400 hover:text-blue-300 text-xs"
                              >
                                🔄 Refresh
                              </button>
                            </div>
                            <div className="max-h-[600px] overflow-y-auto border border-gray-700 rounded">
                              <TickTable ticks={dayTicks} />
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <div className="animate-spin w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full mx-auto mb-3"></div>
                            <div>Loading ticks...</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-lg mb-2">No historical data available</div>
              <div className="text-sm">Run test mode to start collecting data</div>
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">
            <span className="font-semibold text-gray-300">Collection Window:</span> 14:55 - 15:05 IST (Monday to Friday)
            <br />
            <span className="font-semibold text-gray-300">Data Source:</span> Dhan HQ Market Feed API
            <br />
            <span className="font-semibold text-gray-300">Auto-polling:</span> Automatically fetches data every 3 seconds during active window. Use the "Stop/Start Auto-Polling" button to control it manually.
            <br />
            <span className="font-semibold text-purple-400">🧪 Test Mode:</span> Click "Test Mode" button to collect data for 1 minute anytime. Click "Cancel" to stop early.
            <br />
            <span className="font-semibold text-yellow-400">⚠️ Note:</span> Some fields (Open, High, Low, Volume, OI) may show "-" when market is closed or if Dhan API returns limited data. Change % is calculated from previous close when available.
          </p>
        </div>
      </div>
    </div>
  );
}
