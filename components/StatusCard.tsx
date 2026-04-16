'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StatusCardProps {
  title: string;
  value: string;
  subtitle?: string | ReactNode;
  icon: ReactNode;
  highlight?: boolean;
}

export default function StatusCard({ title, value, subtitle, icon, highlight }: StatusCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`bg-card border rounded-xl p-6 transition-all ${
        highlight 
          ? 'border-accent shadow-lg shadow-accent/20' 
          : 'border-gray-800 hover:border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</div>
        <div className="text-gray-600">{icon}</div>
      </div>
      <div className="space-y-1">
        <motion.div 
          key={value}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-white font-mono"
        >
          {value}
        </motion.div>
        {subtitle && (
          <div className="text-sm text-gray-400">
            {subtitle}
          </div>
        )}
      </div>
    </motion.div>
  );
}
