'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, TrendingUp, TrendingDown, Activity, Clock, Calendar } from 'lucide-react';
import StatusCard from '@/components/StatusCard';
import LiveChart from '@/components/LiveChart';
import TicksTable from '@/components/TicksTable';
import DayCard from '@/components/DayCard';
import SettingsModal from '@/components/SettingsModal';
import ActionButton from '@/components/ActionButton';
import { Nifty50Tick } from '@/lib/types';
import { formatISTTime, getISTTime } from '@/lib/time';

interface StatusData {
  isWithinWindow: boolean;
  currentTime: string;
  nextWindowStart: string;
  nextWindowStartTimestamp?: number;
  secondsUntilWindow: number;
  todayTickCount: number;
}

export default function Dashboard() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [ticks, setTicks] = useState<Nifty50Tick[]>([]);
  const [latestTick, setLatestTick] = useState<Nifty50Tick | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [autoPollingEnabled, setAutoPollingEnabled] = useState(true);
  const [lastFetchError, setLastFetchError] = useState<string | null>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testProgress, setTestProgress] = useState<string>('');
  const [testAbortController, setTestAbortController] = useState<AbortController | null>(null);
  const [testTicksCollected, setTestTicksCollected] = useState(0);
  const [dailySummaries, setDailySummaries] = useState<any[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [dateTicksMap, setDateTicksMap] = useState<Map<string, Nifty50Tick[]>>(new Map());
  const [clientSecondsUntilWindow, setClientSecondsUntilWindow] = useState<number>(0);
  const [clientCurrentTime, setClientCurrentTime] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previousLTP, setPreviousLTP] = useState<number | null>(null);
  
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };
  
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
  
  const fetchTodayTicks = async () => {
    try {
      const today = formatISTTime(getISTTime(), 'yyyy-MM-dd');
      const res = await fetch(`/api/ticks?date=${today}`);
      if (!res.ok) return;
      const data = await res.json();
      setTicks(data.ticks || []);
      if (data.ticks && data.ticks.length > 0) {
        const newLatest = data.ticks[0];
        if (latestTick && newLatest.ltp !== latestTick.ltp) {
          setPreviousLTP(latestTick.ltp);
        }
        setLatestTick(newLatest);
      }
    } catch (error) {
      console.error('Failed to fetch ticks:', error);
    }
  };
  
  const toggleDayExpansion = async (date: string) => {
    const newExpandedDates = new Set(expandedDates);
    if (expandedDates.has(date)) {
      newExpandedDates.delete(date);
      setExpandedDates(newExpandedDates);
    } else {
      newExpandedDates.add(date);
      setExpandedDates(newExpandedDates);
      try {
        const res = await fetch(`/api/ticks?date=${date}`);
        if (res.ok) {
          const data = await res.json();
          const newMap = new Map(dateTicksMap);
          newMap.set(date, data.ticks || []);
          setDateTicksMap(newMap);
        }
      } catch (error) {
        console.error('Failed to fetch ticks for date:', date, error);
      }
    }
  };
  
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
        headers: { 'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET || '' }
      });
      const data = await res.json();
      if (!res.ok) {
        setLastFetchError(data.message || 'Failed to fetch data');
        setTimeout(() => setLastFetchError(null), 8000);
        return;
      }
      await fetchTodayTicks();
      setLastFetchError(null);
    } catch (error: any) {
      setLastFetchError('Network error. Please check your connection.');
      setTimeout(() => setLastFetchError(null), 8000);
    }
  };
  
  const handleTestCollect = async () => {
    if (isTestRunning) return;
    const confirmed = confirm('This will collect Nifty 50 data every 3 seconds for 1 minute (about 20 ticks).\n\nContinue?');
    if (!confirmed) return;
    
    setIsTestRunning(true);
    setTestProgress('Starting test collection...');
    setLastFetchError(null);
    setTestTicksCollected(0);
    
    const abortController = new AbortController();
    setTestAbortController(abortController);
    
    const startTime = Date.now();
    const duration = 60 * 1000;
    let tickCount = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;
    
    try {
      while (Date.now() - startTime < duration && !abortController.signal.aborted) {
        try {
          const quoteRes = await fetch('/api/fetch-tick', {
            method: 'POST',
            headers: {
              'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET || '',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ testMode: true }),
            signal: abortController.signal
          });
          
          const responseData = await quoteRes.json();
          
          if (!quoteRes.ok) {
            consecutiveErrors++;
            if (consecutiveErrors >= maxConsecutiveErrors) {
              setLastFetchError(`Stopped after ${maxConsecutiveErrors} consecutive failures.`);
              break;
            }
          } else {
            consecutiveErrors = 0;
            tickCount++;
            setTestTicksCollected(tickCount);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = 60 - elapsed;
            setTestProgress(`Collecting... ${tickCount} ticks (${remaining}s remaining)`);
            setLastFetchError(null);
            await fetchTodayTicks();
          }
        } catch (error: any) {
          if (error.name === 'AbortError') break;
          consecutiveErrors++;
          if (consecutiveErrors >= maxConsecutiveErrors) {
            setLastFetchError(`Stopped after ${maxConsecutiveErrors} consecutive failures.`);
            break;
          }
        }
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, 3000);
          abortController.signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new Error('Aborted'));
          });
        }).catch(() => {});
        
        if (abortController.signal.aborted) break;
      }
      
      if (abortController.signal.aborted) {
        setTestProgress(`Test cancelled. Collected ${tickCount} ticks.`);
      } else if (consecutiveErrors >= maxConsecutiveErrors) {
        setTestProgress(`Test stopped due to errors. Collected ${tickCount} ticks.`);
      } else {
        setTestProgress(`Test completed! Collected ${tickCount} ticks.`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchTodayTicks();
      await fetchAvailableDates();
      
      setTimeout(() => {
        setTestProgress('');
        setLastFetchError(null);
      }, 8000);
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setLastFetchError(error.message || 'Unexpected error during test');
        setTestProgress(`Test failed. Collected ${tickCount} ticks.`);
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
  
  const handleCancelTest = () => {
    if (testAbortController) {
      testAbortController.abort();
    }
  };
  
  useEffect(() => {
    if (status?.isWithinWindow && autoPollingEnabled && !isPolling) {
      setIsPolling(true);
      const pollInterval = setInterval(async () => {
        await handleFetchNow();
      }, 3000);
      return () => {
        clearInterval(pollInterval);
        setIsPolling(false);
      };
    } else if (isPolling && (!status?.isWithinWindow || !autoPollingEnabled)) {
      setIsPolling(false);
    }
  }, [status?.isWithinWindow, autoPollingEnabled]);
  
  useEffect(() => {
    fetchStatus();
    fetchAvailableDates();
    fetchTodayTicks();
    const statusInterval = setInterval(fetchStatus, 10000);
    return () => clearInterval(statusInterval);
  }, []);
  
  useEffect(() => {
    if (!status?.nextWindowStartTimestamp) {
      setClientSecondsUntilWindow(status?.secondsUntilWindow || 0);
      return;
    }
    const calculateSeconds = () => {
      const now = Date.now();
      const seconds = Math.floor((status.nextWindowStartTimestamp! - now) / 1000);
      return Math.max(0, seconds);
    };
    setClientSecondsUntilWindow(calculateSeconds());
    const countdownInterval = setInterval(() => {
      setClientSecondsUntilWindow(calculateSeconds());
    }, 1000);
    return () => clearInterval(countdownInterval);
  }, [status?.nextWindowStartTimestamp]);
  
  useEffect(() => {
    if (!status?.currentTime) return;
    const [datePart, timePart] = status.currentTime.split(' ');
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    const serverSeconds = hours * 3600 + minutes * 60 + seconds;
    const fetchTime = Date.now();
    
    const updateClock = () => {
      const elapsedMs = Date.now() - fetchTime;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      let totalSeconds = serverSeconds + elapsedSeconds;
      if (totalSeconds >= 86400) totalSeconds = totalSeconds % 86400;
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      setClientCurrentTime(timeString);
    };
    
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, [status?.currentTime]);
  
  const openingPrice = ticks.length > 0 ? ticks[ticks.length - 1].ltp : 0;
  const changePercent = latestTick && openingPrice > 0 
    ? ((latestTick.ltp - openingPrice) / openingPrice) * 100 
    : 0;
  const isPositive = changePercent >= 0;
  
  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="min-h-screen bg-background">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-gray-800"
      >
        <div className="max-w-[1920px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-accent via-positive to-accent bg-clip-text text-transparent">
              Nifty 50 Data Collector
            </h1>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="font-mono text-xl text-white">{clientCurrentTime || '--:--:--'}</span>
              <span className="text-gray-500">IST</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {status?.isWithinWindow ? (
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-positive/10 border border-positive/30 rounded-full"
              >
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-2 h-2 bg-positive rounded-full"
                />
                <span className="text-positive font-semibold text-sm">LIVE</span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full">
                <div className="w-2 h-2 bg-gray-500 rounded-full" />
                <span className="text-gray-400 font-semibold text-sm">OUTSIDE WINDOW</span>
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-[1920px] mx-auto px-6 py-6 space-y-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-gray-800 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-8">
            <div>
              <div className="text-xs text-gray-500 mb-1">Collection Window</div>
              <div className="text-sm font-semibold text-white">14:55 - 15:05 IST (Mon-Fri)</div>
            </div>
            <div className="h-8 w-px bg-gray-800" />
            <div>
              <div className="text-xs text-gray-500 mb-1">Next Window In</div>
              <div className="text-2xl font-mono font-bold text-accent">{formatCountdown(clientSecondsUntilWindow)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-positive" />
            <span className="text-sm text-gray-400">Market</span>
            <span className="text-sm font-semibold text-positive">Open</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            title="Current Time"
            value={clientCurrentTime || '--:--:--'}
            subtitle="IST"
            icon={<Clock className="w-5 h-5" />}
          />
          <StatusCard
            title="Latest LTP"
            value={latestTick ? `₹${latestTick.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}
            subtitle={latestTick ? (
              <span className={isPositive ? 'text-positive' : 'text-negative'}>
                {isPositive ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                {' '}{isPositive ? '+' : ''}{changePercent.toFixed(2)}%
              </span>
            ) : ''}
            icon={<Activity className="w-5 h-5" />}
            highlight={latestTick !== null}
          />
          <StatusCard
            title="Today's Ticks"
            value={status?.todayTickCount?.toString() || '0'}
            subtitle="collected"
            icon={<Calendar className="w-5 h-5" />}
          />
          <StatusCard
            title={status?.isWithinWindow ? 'Window Status' : 'Next Window'}
            value={status?.isWithinWindow ? 'LIVE' : formatCountdown(clientSecondsUntilWindow)}
            subtitle={status?.isWithinWindow ? 'collecting data' : 'countdown'}
            icon={<Activity className="w-5 h-5" />}
            highlight={status?.isWithinWindow}
          />
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-gray-800 rounded-xl p-6"
        >
          <div className="flex flex-wrap items-center gap-3">
            <ActionButton
              onClick={handleFetchNow}
              disabled={!status?.isWithinWindow}
              variant="primary"
            >
              Fetch Now
            </ActionButton>
            
            {status?.isWithinWindow && (
              <ActionButton
                onClick={() => setAutoPollingEnabled(!autoPollingEnabled)}
                variant={autoPollingEnabled ? 'success' : 'secondary'}
              >
                {autoPollingEnabled ? '⏸️ Stop' : '▶️ Start'} Auto-Polling
              </ActionButton>
            )}
            
            {!isTestRunning ? (
              <ActionButton
                onClick={handleTestCollect}
                variant="purple"
              >
                🧪 Test Mode (1 min)
              </ActionButton>
            ) : (
              <>
                <ActionButton disabled variant="secondary">
                  Testing... ({testTicksCollected} ticks)
                </ActionButton>
                <ActionButton onClick={handleCancelTest} variant="danger">
                  ❌ Cancel
                </ActionButton>
              </>
            )}
            
            <AnimatePresence>
              {isPolling && autoPollingEnabled && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-2 text-sm text-positive"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-2 h-2 bg-positive rounded-full"
                  />
                  Auto-polling active (3s)
                </motion.div>
              )}
              
              {testProgress && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm font-medium text-accent"
                >
                  {testProgress}
                </motion.div>
              )}
              
              {lastFetchError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-negative bg-negative/10 px-3 py-2 rounded-lg border border-negative/30"
                >
                  ⚠ {lastFetchError}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <LiveChart ticks={ticks} />
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <TicksTable ticks={ticks} title="Live Ticks" />
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Historical Data</h2>
              <p className="text-sm text-gray-500">Click on any day to expand and view all ticks</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={async () => {
                await fetchAvailableDates();
                const today = formatISTTime(getISTTime(), 'yyyy-MM-dd');
                const newExpandedDates = new Set<string>();
                newExpandedDates.add(today);
                setExpandedDates(newExpandedDates);
                try {
                  const res = await fetch(`/api/ticks?date=${today}`);
                  if (res.ok) {
                    const data = await res.json();
                    const newMap = new Map<string, any[]>();
                    newMap.set(today, data.ticks || []);
                    setDateTicksMap(newMap);
                  }
                } catch (error) {
                  console.error('Failed to refresh:', error);
                }
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
            >
              🔄 Refresh
            </motion.button>
          </div>
          
          {dailySummaries.length > 0 ? (
            <div className="space-y-3">
              {dailySummaries.map((summary, index) => (
                <DayCard
                  key={summary.date}
                  summary={summary}
                  isExpanded={expandedDates.has(summary.date)}
                  onToggle={() => toggleDayExpansion(summary.date)}
                  ticks={dateTicksMap.get(summary.date) || []}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-lg mb-2">No historical data available</div>
              <div className="text-sm">Run test mode to start collecting data</div>
            </div>
          )}
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-card/50 border border-gray-800 rounded-xl p-4 text-sm text-gray-400"
        >
          <span className="font-semibold text-gray-300">Collection Window:</span> 14:55 - 15:05 IST (Mon-Fri) • 
          <span className="font-semibold text-gray-300"> Data Source:</span> Dhan HQ Market Feed API • 
          <span className="font-semibold text-gray-300"> Auto-polling:</span> Every 3 seconds during window
        </motion.div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
