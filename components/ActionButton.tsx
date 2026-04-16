'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ActionButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'purple';
  children: ReactNode;
}

export default function ActionButton({ 
  onClick, 
  disabled = false, 
  variant = 'primary', 
  children 
}: ActionButtonProps) {
  const variants = {
    primary: 'bg-accent hover:bg-accent/90 text-white disabled:bg-gray-800 disabled:text-gray-600',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-white disabled:bg-gray-900 disabled:text-gray-600',
    success: 'bg-positive hover:bg-positive/90 text-black disabled:bg-gray-800 disabled:text-gray-600',
    danger: 'bg-negative hover:bg-negative/90 text-white disabled:bg-gray-800 disabled:text-gray-600',
    purple: 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-800 disabled:text-gray-600',
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${variants[variant]} ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer shadow-lg'
      }`}
    >
      {children}
    </motion.button>
  );
}
