'use client';

import { Nifty50Tick } from '@/lib/types';

interface TickTableProps {
  ticks: Nifty50Tick[];
}

export default function TickTable({ ticks }: TickTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-800 border-b border-gray-700 sticky top-0">
          <tr>
            <th className="px-4 py-3 text-left text-gray-400 font-medium">Time</th>
            <th className="px-4 py-3 text-right text-gray-400 font-medium">LTP</th>
            <th className="px-4 py-3 text-right text-gray-400 font-medium">Open</th>
            <th className="px-4 py-3 text-right text-gray-400 font-medium">High</th>
            <th className="px-4 py-3 text-right text-gray-400 font-medium">Low</th>
            <th className="px-4 py-3 text-right text-gray-400 font-medium">Close</th>
            <th className="px-4 py-3 text-right text-gray-400 font-medium">Change</th>
            <th className="px-4 py-3 text-right text-gray-400 font-medium">Change %</th>
            <th className="px-4 py-3 text-right text-gray-400 font-medium">Volume</th>
            <th className="px-4 py-3 text-right text-gray-400 font-medium">OI</th>
            <th className="px-4 py-3 text-center text-gray-400 font-medium">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {ticks.map((tick, index) => {
            const change = tick.net_change || 0;
            const changePercent = tick.percent_change || 0;
            const isPositive = change >= 0;
            
            return (
              <tr key={tick.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3 text-gray-300 font-mono text-xs">
                  {new Date(tick.fetched_at).toLocaleTimeString('en-IN', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit',
                    hour12: false
                  })}
                </td>
                <td className="px-4 py-3 text-right font-mono text-white font-semibold">
                  {tick.ltp.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-400">
                  {tick.open_price?.toFixed(2) || '-'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-green-400">
                  {tick.high_price?.toFixed(2) || '-'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-red-400">
                  {tick.low_price?.toFixed(2) || '-'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-400">
                  {tick.close_price?.toFixed(2) || '-'}
                </td>
                <td className={`px-4 py-3 text-right font-mono font-semibold ${
                  isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isPositive ? '+' : ''}{change.toFixed(2)}
                </td>
                <td className={`px-4 py-3 text-right font-mono font-semibold ${
                  isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-right text-gray-400 font-mono text-xs">
                  {tick.volume ? (tick.volume / 1000000).toFixed(2) + 'M' : '-'}
                </td>
                <td className="px-4 py-3 text-right text-gray-400 font-mono text-xs">
                  {tick.open_interest ? (tick.open_interest / 1000).toFixed(1) + 'K' : '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    tick.data_source === 'test_mode' 
                      ? 'bg-purple-900/30 text-purple-400 border border-purple-700' 
                      : 'bg-blue-900/30 text-blue-400 border border-blue-700'
                  }`}>
                    {tick.data_source === 'test_mode' ? 'TEST' : 'LIVE'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {ticks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No data available</div>
          <div className="text-gray-600 text-sm">
            Select a different date or run test mode to collect data
          </div>
        </div>
      )}
    </div>
  );
}
