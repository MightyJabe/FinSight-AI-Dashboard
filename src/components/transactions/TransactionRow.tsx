'use client';

import type { LucideIcon } from 'lucide-react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Brain,
  Building2,
  Car,
  CreditCard,
  Dumbbell,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Lightbulb,
  MoreHorizontal,
  PiggyBank,
  Plane,
  Receipt,
  Repeat,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Utensils,
  Wallet,
} from 'lucide-react';
import { memo, useState } from 'react';

import { cn , formatCurrency } from '@/lib/utils';

import { CategoryEditor } from './CategoryEditor';

interface TransactionRowProps {
  transaction: {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    aiCategory?: string;
    aiConfidence?: number;
    date: string;
    description: string;
    account: string;
    accountId: string;
  };
  onCategoryUpdate: (transactionId: string, newCategory: string, type: 'income' | 'expense') => void;
  isUpdating: boolean;
  index: number;
}

// Category icon mapping
const categoryIcons: Record<string, LucideIcon> = {
  // Expense categories
  'Housing': Home,
  'Utilities': Lightbulb,
  'Groceries': ShoppingBag,
  'Transportation': Car,
  'Healthcare': Heart,
  'Insurance': Building2,
  'Debt Payments': CreditCard,
  'Dining Out': Utensils,
  'Entertainment': Sparkles,
  'Shopping': ShoppingBag,
  'Travel': Plane,
  'Fitness & Health': Dumbbell,
  'Education': GraduationCap,
  'Personal Care': Heart,
  'Savings': PiggyBank,
  'Investments': TrendingUp,
  'Transfers': Repeat,
  'Bank Fees': Receipt,
  'Gifts & Donations': Gift,
  'Business Expenses': Building2,
  'Taxes': Receipt,
  'Uncategorized': MoreHorizontal,
  // Income categories
  'Salary': Banknote,
  'Freelance Income': Wallet,
  'Investment Returns': TrendingUp,
  'Rental Income': Home,
  'Business Income': Building2,
  'Government Benefits': Building2,
  'Gifts Received': Gift,
  'Other Income': Wallet,
};

// Category color mapping
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  // Essential (blue tones)
  'Housing': { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
  'Utilities': { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20' },
  'Healthcare': { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20' },
  'Insurance': { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20' },
  // Food
  'Groceries': { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  'Dining Out': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20' },
  // Transport
  'Transportation': { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/20' },
  'Travel': { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500/20' },
  // Lifestyle
  'Entertainment': { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/20' },
  'Shopping': { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-600 dark:text-fuchsia-400', border: 'border-fuchsia-500/20' },
  'Fitness & Health': { bg: 'bg-lime-500/10', text: 'text-lime-600 dark:text-lime-400', border: 'border-lime-500/20' },
  'Education': { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
  'Personal Care': { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20' },
  // Financial
  'Savings': { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/20' },
  'Investments': { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/20' },
  'Transfers': { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/20' },
  'Debt Payments': { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20' },
  'Bank Fees': { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/20' },
  // Other
  'Gifts & Donations': { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' },
  'Business Expenses': { bg: 'bg-zinc-500/10', text: 'text-zinc-600 dark:text-zinc-400', border: 'border-zinc-500/20' },
  'Taxes': { bg: 'bg-stone-500/10', text: 'text-stone-600 dark:text-stone-400', border: 'border-stone-500/20' },
  'Uncategorized': { bg: 'bg-neutral-500/10', text: 'text-neutral-600 dark:text-neutral-400', border: 'border-neutral-500/20' },
  // Income
  'Salary': { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  'Freelance Income': { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
  'Investment Returns': { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/20' },
  'Rental Income': { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/20' },
  'Business Income': { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
  'Government Benefits': { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20' },
  'Gifts Received': { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/20' },
  'Other Income': { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/20' },
};

const defaultColor = { bg: 'bg-secondary', text: 'text-muted-foreground', border: 'border-border' };

/**
 * Formats a date string into a more readable format
 */
function formatDate(dateString: string): { day: string; month: string; year: string } {
  const date = new Date(dateString);
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: date.toLocaleString('en-US', { month: 'short' }),
    year: date.getFullYear().toString(),
  };
}

/**
 * Premium transaction row component with category icons, smooth animations,
 * and proper color-coding for income/expenses.
 */
export const TransactionRow = memo(function TransactionRow({
  transaction,
  onCategoryUpdate,
  isUpdating,
  index,
}: TransactionRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  const Icon = categoryIcons[transaction.category] || Wallet;
  const colors = categoryColors[transaction.category] || defaultColor;
  const formattedDate = formatDate(transaction.date);

  const isIncome = transaction.type === 'income';
  const displayAmount = Math.abs(transaction.amount);

  return (
    <tr
      className={cn(
        'group relative transition-all duration-200',
        'hover:bg-secondary/50 dark:hover:bg-secondary/30',
        isUpdating && 'opacity-60 pointer-events-none'
      )}
      style={{ animationDelay: `${index * 30}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`transaction-row-${transaction.id}`}
    >
      {/* Date Column */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex flex-col items-center w-12">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {formattedDate.month}
          </span>
          <span className="text-lg font-semibold tabular-nums">
            {formattedDate.day}
          </span>
        </div>
      </td>

      {/* Description Column */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Category Icon */}
          <div
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
              'transition-transform duration-200',
              colors.bg,
              isHovered && 'scale-110'
            )}
          >
            <Icon className={cn('w-5 h-5', colors.text)} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground truncate">
              {transaction.description}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {transaction.account}
            </p>
          </div>
        </div>
      </td>

      {/* Category Column */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              'border transition-colors duration-200',
              colors.bg,
              colors.text,
              colors.border
            )}
          >
            {transaction.category}
          </span>

          {/* AI Badge */}
          {transaction.aiCategory && transaction.aiConfidence && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full',
                'bg-violet-500/10 border border-violet-500/20'
              )}
              title={`AI Confidence: ${transaction.aiConfidence}%`}
            >
              <Brain className="w-3 h-3 text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
                {transaction.aiConfidence}%
              </span>
            </div>
          )}

          {/* Category Editor */}
          <CategoryEditor
            currentCategory={transaction.category}
            aiCategory={transaction.aiCategory}
            aiConfidence={transaction.aiConfidence}
            transactionType={transaction.type}
            onCategoryChange={(newCategory) =>
              onCategoryUpdate(transaction.id, newCategory, transaction.type)
            }
            disabled={isUpdating}
          />
        </div>
      </td>

      {/* Amount Column */}
      <td className="px-4 py-4 text-right">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5">
            {isIncome ? (
              <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            )}
            <span
              className={cn(
                'text-base font-semibold tabular-nums',
                isIncome
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {isIncome ? '+' : '-'}
              {formatCurrency(displayAmount)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-0.5">
            {formattedDate.year}
          </span>
        </div>
      </td>
    </tr>
  );
});

export default TransactionRow;
