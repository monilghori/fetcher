'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Nifty50Tick } from '@/lib/types';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface LiveChartProps {
  ticks: Nifty50Tick[];
}

export default function LiveChart({ ticks }: LiveChartProps) {
  const chartData = ticks
    .slice()
    .reverse()
    .map(tick => ({
      time: new Date(tick.fetched_at).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      ltp: tick.ltp,
      timestamp: new Date(tick.fetched_at).getTime()
    }));
  
  if (chartData.length === 0) {
    return (
      <div className="bg-card border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-bold text-white">Today's LTP Chart</h2>
        </div>
        <div className="h-80 flex flex-col items-center justify-center text-gray-500">
          <div className="w-16 h-16 mb-4 opacity-20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M18 17l-5-5-3 3-4-4" />
            </svg>
          </div>
          <div className="text-lg font-medium">No data to display</div>
          <div className="text-sm mt-1">Start collecting data to see the chart</div>
        </div>
      </div>
    );
  }
  
  const minValue = Math.min(...chartData.map(d => d.ltp));
  const maxValue = Math.max(...chartData.map(d => d.ltp));
  const isPositive = chartData[chartData.length - 1].ltp >= chartData[0].ltp;
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card border border-gray-800 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-bold text-white">Today's LTP Chart</h2>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-500">High: </span>
            <span className="text-positive font-mono font-semibold">₹{maxValue.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-500">Low: </span>
            <span className="text-negative font-mono font-semibold">₹{minValue.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorLtp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? "#00E676" : "#FF5252"} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={isPositive ? "#00E676" : "#FF5252"} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#6B7280"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#374151' }}
          />
          <YAxis 
            stroke="#6B7280"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#374151' }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `₹${value.toFixed(0)}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
            labelStyle={{ color: '#F3F4F6', fontWeight: 600, marginBottom: '4px' }}
            itemStyle={{ color: isPositive ? '#00E676' : '#FF5252', fontFamily: 'monospace' }}
            formatter={(value: any) => [`₹${value.toFixed(2)}`, 'LTP']}
            cursor={{ stroke: '#6B7280', strokeWidth: 1, strokeDasharray: '5 5' }}
          />
          <Area 
            type="monotone" 
            dataKey="ltp" 
            stroke={isPositive ? "#00E676" : "#FF5252"}
            strokeWidth={2.5}
            fill="url(#colorLtp)"
            animationDuration={800}
            dot={false}
            activeDot={{ r: 6, fill: isPositive ? "#00E676" : "#FF5252", stroke: '#141720', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
