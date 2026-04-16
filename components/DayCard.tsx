'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Calendar } from 'lucide-react';
import { Nifty50Tick } from '@/lib/types';
import TicksTable from './TicksTable';

interface DayCardProps {
  summary: any;
  isExpanded: boolean;
  onToggle: () => void;
  ticks: Nifty50Tick[];
  index: number;
}

export default function DayCard({ summary, isExpanded, onToggle, ticks, index }: DayCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/30"
    >
      <motion.button
        onClick={onToggle}
        whileHover={{ backgroundColor: 'rgba(31, 41, 55, 0.5)' }}
        className="w-full p-5 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </motion.div>
          <Calendar className="w-5 h-5 text-accent" />
          <div className="text-left">
            <div className="text-white font-semibold text-lg">
              {formatDate(summary.date)}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">
              {summary.tick_count} ticks collected
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">High</div>
            <div className="text-positive font-mono font-bold text-sm">
              ₹{summary.high_ltp?.toFixed(2) || '-'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Low</div>
            <div className="text-negative font-mono font-bold text-sm">
              ₹{summary.low_ltp?.toFixed(2) || '-'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Open</div>
            <div className="text-accent font-mono font-bold text-sm">
              ₹{summary.opening_ltp?.toFixed(2) || '-'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Close</div>
            <div className="text-purple-400 font-mono font-bold text-sm">
              ₹{summary.closing_ltp?.toFixed(2) || '-'}
            </div>
          </div>
        </div>
      </motion.button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-800 p-4 bg-background">
              {ticks.length > 0 ? (
                <>
                  <div className="mb-3 text-sm text-gray-400 flex items-center justify-between">
                    <span>Showing {ticks.length} ticks</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                      }}
                      className="text-accent hover:text-accent/80 text-xs font-medium"
                    >
                      🔄 Refresh
                    </button>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto rounded-lg border border-gray-800">
                    <TicksTable ticks={ticks} title="" />
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="skeleton w-full h-32 rounded-lg mb-3"></div>
                  <div className="text-sm">Loading ticks...</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
