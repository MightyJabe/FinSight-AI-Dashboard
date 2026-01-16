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

import { formatCurrency } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  index: number;
}

function StatCard({ title, value, change, icon: Icon, index }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-md transition-all hover:border-indigo-300 hover:shadow-xl"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-900">{value}</h3>

          <div className="mt-3 flex items-center gap-1">
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            )}
            <span
              className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}
            >
              {isPositive ? '+' : ''}
              {change.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500">vs last month</span>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-3 transition-transform group-hover:scale-110">
          <Icon className="h-7 w-7 text-indigo-600" />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 transition-opacity group-hover:opacity-100" />
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={stat.title} {...stat} index={index} />
      ))}
    </div>
  );
}
