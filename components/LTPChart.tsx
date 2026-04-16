'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Nifty50Tick } from '@/lib/types';

interface LTPChartProps {
  ticks: Nifty50Tick[];
}

export default function LTPChart({ ticks }: LTPChartProps) {
  const chartData = ticks
    .slice()
    .reverse()
    .map(tick => ({
      time: new Date(tick.fetched_at).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      ltp: tick.ltp
    }));
  
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No data to display
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="time" 
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF' }}
        />
        <YAxis 
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF' }}
          domain={['auto', 'auto']}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937', 
            border: '1px solid #374151',
            borderRadius: '0.5rem'
          }}
          labelStyle={{ color: '#F3F4F6' }}
        />
        <Line 
          type="monotone" 
          dataKey="ltp" 
          stroke="#10B981" 
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
