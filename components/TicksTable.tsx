'use client';

import { Nifty50Tick } from '@/lib/types';
import { motion } from 'framer-motion';
import { Database, TrendingUp, TrendingDown } from 'lucide-react';

interface TicksTableProps {
  ticks: Nifty50Tick[];
  title?: string;
}

export default function TicksTable({ ticks, title = 'Ticks' }: TicksTableProps) {
  const formatIndianNumber = (num: number) => {
    return num.toLocaleString('en-IN');
  };

  return (
    <div className="bg-card border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
        <Database className="w-5 h-5 text-accent" />
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <span className="text-sm text-gray-500">({ticks.length} records)</span>
      </div>
      
      {ticks.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 opacity-20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 3v18" />
            </svg>
          </div>
          <div className="text-lg font-medium mb-1">No data available</div>
          <div className="text-sm">Select a different date or run test mode to collect data</div>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/50 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 text-left text-gray-400 font-semibold text-xs uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-right text-gray-400 font-semibold text-xs uppercase tracking-wider">LTP</th>
                <th className="px-4 py-3 text-right text-gray-400 font-semibold text-xs uppercase tracking-wider">Open</th>
                <th className="px-4 py-3 text-right text-gray-400 font-semibold text-xs uppercase tracking-wider">High</th>
                <th className="px-4 py-3 text-right text-gray-400 font-semibold text-xs uppercase tracking-wider">Low</th>
                <th className="px-4 py-3 text-right text-gray-400 font-semibold text-xs uppercase tracking-wider">Close</th>
                <th className="px-4 py-3 text-right text-gray-400 font-semibold text-xs uppercase tracking-wider">Change</th>
                <th className="px-4 py-3 text-right text-gray-400 font-semibold text-xs uppercase tracking-wider">Change %</th>
                <th className="px-4 py-3 text-right text-gray-400 font-semibold text-xs uppercase tracking-wider">Volume</th>
                <th className="px-4 py-3 text-right text-gray-400 font-semibold text-xs uppercase tracking-wider">OI</th>
                <th className="px-4 py-3 text-center text-gray-400 font-semibold text-xs uppercase tracking-wider">Source</th>
              </tr>
            </thead>
            <tbody>
              {ticks.map((tick, index) => {
                let change = 0;
                let changePercent = 0;
                
                if (index < ticks.length - 1) {
                  const previousTick = ticks[index + 1];
                  change = tick.ltp - previousTick.ltp;
                  changePercent = previousTick.ltp > 0 ? (change / previousTick.ltp) * 100 : 0;
                }
                
                const isPositive = change >= 0;
                const isLatest = index === 0;
                
                return (
                  <motion.tr
                    key={tick.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
                      isLatest ? 'bg-accent/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-300 font-mono text-xs">
                      {new Date(tick.fetched_at).toLocaleTimeString('en-IN', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit',
                        hour12: false
                      })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-white font-bold">
                      ₹{tick.ltp.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-400 text-xs">
                      {tick.open_price ? `₹${tick.open_price.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-positive text-xs">
                      {tick.high_price ? `₹${tick.high_price.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-negative text-xs">
                      {tick.low_price ? `₹${tick.low_price.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-400 text-xs">
                      {tick.close_price ? `₹${tick.close_price.toFixed(2)}` : '-'}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold text-xs ${
                      isPositive ? 'text-positive' : 'text-negative'
                    }`}>
                      {index < ticks.length - 1 ? (
                        <>
                          {isPositive ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                          {isPositive ? '+' : ''}₹{change.toFixed(2)}
                        </>
                      ) : '-'}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold text-xs ${
                      isPositive ? 'text-positive' : 'text-negative'
                    }`}>
                      {index < ticks.length - 1 ? (
                        <>{isPositive ? '+' : ''}{changePercent.toFixed(2)}%</>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 font-mono text-xs">
                      {tick.volume ? formatIndianNumber(tick.volume) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 font-mono text-xs">
                      {tick.open_interest ? formatIndianNumber(tick.open_interest) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        tick.data_source === 'test_mode' 
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' 
                          : 'bg-accent/10 text-accent border border-accent/30'
                      }`}>
                        {tick.data_source === 'test_mode' ? 'TEST' : 'LIVE'}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
