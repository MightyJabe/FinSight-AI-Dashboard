'use client';

import { motion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  PiggyBank,
  TrendingUp,
} from 'lucide-react';

import { staggeredContainer, staggeredItem } from '@/lib/animations';
import { formatCurrency } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  index: number;
}

function StatCard({ title, value, change, icon: Icon }: Omit<StatCardProps, 'index'>) {
  const isPositive = change >= 0;

  return (
    <motion.div
      variants={staggeredItem}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      className="@container group relative overflow-hidden rounded-2xl glass-card-strong p-6 cursor-pointer card-hover"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="mt-3 text-3xl @lg:text-4xl font-bold gradient-text tabular-nums">{value}</h3>

          <div className="mt-3 flex items-center gap-1 flex-wrap">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
            >
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-500" />
              )}
            </motion.div>
            <span
              className={`text-sm font-medium tabular-nums ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}
            >
              {isPositive ? '+' : ''}
              {change.toFixed(1)}%
            </span>
            <span className="text-sm text-muted-foreground">vs last month</span>
          </div>
        </div>

        <motion.div
          className="rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-600/10 p-3 border border-blue-500/20"
          whileHover={{ scale: 1.15, rotate: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          <Icon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        </motion.div>
      </div>

      <motion.div
        className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 glow-md"
        initial={{ scaleX: 0, opacity: 0 }}
        whileHover={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transformOrigin: 'left' }}
      />

      {/* Subtle particle effect on hover */}
      <div className="absolute inset-0 particles-bg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  );
}

interface StatsGridProps {
  income: number;
  expenses: number;
  investments: number;
  savings: number;
  currency?: string;
}

export function StatsGrid({ income, expenses, investments, savings, currency = 'USD' }: StatsGridProps) {
  const stats = [
    {
      title: 'Monthly Income',
      value: formatCurrency(income, currency),
      change: 5.2,
      icon: DollarSign,
    },
    {
      title: 'Monthly Expenses',
      value: formatCurrency(expenses, currency),
      change: -2.1,
      icon: CreditCard,
    },
    {
      title: 'Investments',
      value: formatCurrency(investments, currency),
      change: 8.4,
      icon: TrendingUp,
    },
    { title: 'Savings', value: formatCurrency(savings, currency), change: 12.3, icon: PiggyBank },
  ];

  return (
    <motion.div
      variants={staggeredContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </motion.div>
  );
}
