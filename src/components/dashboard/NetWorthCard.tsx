'use client';

import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface NetWorthCardProps {
  netWorth: number;
  change: number;
  changePercent: number;
}

export function NetWorthCard({ netWorth, change, changePercent }: NetWorthCardProps) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl"
    >
      <div className="relative z-10">
        <p className="text-base font-semibold uppercase tracking-wider text-white/90">
          Total Net Worth
        </p>
        <h2 className="mt-3 text-6xl font-bold tracking-tight drop-shadow-lg">
          $
          {netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>

        <div className="mt-4 flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="h-5 w-5 text-green-300" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-300" />
          )}
          <span className={`text-sm font-medium ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
            {isPositive ? '+' : ''}
            {change.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({isPositive ? '+' : ''}
            {changePercent.toFixed(2)}%)
          </span>
          <span className="text-sm opacity-75">this month</span>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
    </motion.div>
  );
}
