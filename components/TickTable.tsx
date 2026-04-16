'use client';

import { Nifty50Tick } from '@/lib/types';

interface TickTableProps {
  ticks: Nifty50Tick[];
}

export default function TickTable({ ticks }: TickTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-800 border-b border-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-gray-400 font-medium">Time</th>
            <th className="px-4 py-3 text-right text-gray-400 font-medium">LTP</th>
            <th className="px-4 py-3 text-right text-gray-400 font-medium">Change</th>
            <th className="px-4 py-3 text-right text-gray-400 font-medium">Volume</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {ticks.map((tick) => {
            const change = tick.net_change || 0;
            const isPositive = change >= 0;
            
            return (
              <tr key={tick.id} className="hover:bg-gray-800/50">
                <td className="px-4 py-3 text-gray-300">
                  {new Date(tick.fetched_at).toLocaleTimeString('en-IN', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  })}
                </td>
                <td className="px-4 py-3 text-right font-mono text-white">
                  {tick.ltp.toFixed(2)}
                </td>
                <td className={`px-4 py-3 text-right font-mono ${
                  isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isPositive ? '+' : ''}{change.toFixed(2)}
                  {tick.percent_change && ` (${tick.percent_change.toFixed(2)}%)`}
                </td>
                <td className="px-4 py-3 text-right text-gray-400">
                  {tick.volume?.toLocaleString() || '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {ticks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No ticks collected yet
        </div>
      )}
    </div>
  );
}
