'use client';

import { format } from 'date-fns';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  PieChart,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { cn , formatCurrency } from '@/lib/utils';

import { CategoryBreakdown } from './CategoryBreakdown';
import { SpendingBreakdown } from './SpendingBreakdown';
import { TransactionsList } from './TransactionsList';

// Enhanced transaction interface
interface EnhancedTransaction {
  id: string;
  providerTxId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  aiCategory?: string;
  aiConfidence?: number;
  date: string;
  description: string;
  account: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
}

interface TransactionsContentProps {
  transactions: EnhancedTransaction[];
  isLoading?: boolean;
}

// Preset date ranges
const PRESET_RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This month', isThisMonth: true },
  { label: 'Last month', isLastMonth: true },
  { label: 'This year', isThisYear: true },
];

/**
 * Calculate date range from preset
 */
function getDateRangeFromPreset(preset: typeof PRESET_RANGES[number]): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();

  if (preset.isThisMonth) {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
  } else if (preset.isLastMonth) {
    from.setMonth(from.getMonth() - 1);
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    to.setDate(0); // Last day of previous month
    to.setHours(23, 59, 59, 999);
  } else if (preset.isThisYear) {
    from.setMonth(0);
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
  } else if (preset.days) {
    from.setDate(to.getDate() - preset.days);
    from.setHours(0, 0, 0, 0);
  }

  return { from, to };
}

/**
 * Premium transactions content component with date range filtering,
 * spending overview, and tabbed views for list and category breakdown.
 */
export function TransactionsContent({
  transactions: initialTransactions,
  isLoading = false,
}: TransactionsContentProps) {
  // Date range state
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  });

  const [selectedPreset, setSelectedPreset] = useState<string>('Last 30 days');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    return initialTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const dateMatch = transactionDate >= dateRange.from && transactionDate <= dateRange.to;
      const categoryMatch = !selectedCategory || transaction.category === selectedCategory;
      return dateMatch && categoryMatch;
    });
  }, [initialTransactions, dateRange, selectedCategory]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const net = income - expenses;
    const transactionCount = filteredTransactions.length;

    // Get top expense category
    const categoryTotals = new Map<string, number>();
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const current = categoryTotals.get(t.category) || 0;
        categoryTotals.set(t.category, current + Math.abs(t.amount));
      });

    let topCategory = { name: 'N/A', amount: 0 };
    categoryTotals.forEach((amount, category) => {
      if (amount > topCategory.amount) {
        topCategory = { name: category, amount };
      }
    });

    return { income, expenses, net, transactionCount, topCategory };
  }, [filteredTransactions]);

  // Handle preset selection
  const handlePresetSelect = (preset: typeof PRESET_RANGES[number]) => {
    const newRange = getDateRangeFromPreset(preset);
    setDateRange(newRange);
    setSelectedPreset(preset.label);
    setShowDatePicker(false);
  };

  // Handle custom date change
  const handleDateChange = (type: 'from' | 'to', dateString: string) => {
    const newDate = new Date(dateString);
    if (!isNaN(newDate.getTime())) {
      setDateRange(prev => ({
        ...prev,
        [type]: type === 'from'
          ? new Date(newDate.setHours(0, 0, 0, 0))
          : new Date(newDate.setHours(23, 59, 59, 999)),
      }));
      setSelectedPreset('Custom');
    }
  };

  // Handle category filter from spending breakdown
  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Preset buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground hidden sm:block" />
          {PRESET_RANGES.map(preset => (
            <button
              key={preset.label}
              onClick={() => handlePresetSelect(preset)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-full transition-all duration-200',
                'border hover:border-foreground/20',
                selectedPreset === preset.label
                  ? 'bg-foreground text-background border-foreground font-medium'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom date picker toggle */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">
              {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
            </span>
            <span className="sm:hidden">Custom</span>
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                showDatePicker && 'rotate-180'
              )}
            />
          </Button>

          {/* Custom date picker dropdown */}
          {showDatePicker && (
            <div className="absolute right-0 top-full mt-2 p-4 rounded-xl bg-card border border-border shadow-lg z-10 min-w-[280px] animate-in">
              <div className="space-y-4">
                <div>
                  <label htmlFor="from-date" className="block text-sm font-medium text-muted-foreground mb-1.5">
                    From
                  </label>
                  <input
                    id="from-date"
                    type="date"
                    value={format(dateRange.from, 'yyyy-MM-dd')}
                    onChange={e => handleDateChange('from', e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border text-sm',
                      'bg-card border-border text-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring'
                    )}
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label htmlFor="to-date" className="block text-sm font-medium text-muted-foreground mb-1.5">
                    To
                  </label>
                  <input
                    id="to-date"
                    type="date"
                    value={format(dateRange.to, 'yyyy-MM-dd')}
                    onChange={e => handleDateChange('to', e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border text-sm',
                      'bg-card border-border text-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring'
                    )}
                    suppressHydrationWarning
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Filter Banner */}
      {selectedCategory && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20 animate-in">
          <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <p className="text-sm text-violet-700 dark:text-violet-300">
            Filtering by category: <span className="font-medium">{selectedCategory}</span>
          </p>
          <button
            onClick={() => setSelectedCategory(null)}
            className="ml-auto text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="p-5 rounded-2xl bg-card border border-border card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
              Income
            </span>
          </div>
          <p className="metric-label mb-1">Total Income</p>
          <p className="text-xl lg:text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(stats.income)}
          </p>
        </div>

        {/* Expenses Card */}
        <div className="p-5 rounded-2xl bg-card border border-border card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full">
              Expenses
            </span>
          </div>
          <p className="metric-label mb-1">Total Expenses</p>
          <p className="text-xl lg:text-2xl font-semibold tabular-nums text-rose-600 dark:text-rose-400">
            -{formatCurrency(stats.expenses)}
          </p>
        </div>

        {/* Net Card */}
        <div className="p-5 rounded-2xl bg-card border border-border card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center',
              stats.net >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'
            )}>
              <Receipt className={cn(
                'w-4 h-4',
                stats.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              )} />
            </div>
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              stats.net >= 0
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
            )}>
              {stats.net >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>
          <p className="metric-label mb-1">Net Flow</p>
          <p className={cn(
            'text-xl lg:text-2xl font-semibold tabular-nums',
            stats.net >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          )}>
            {stats.net >= 0 ? '+' : ''}{formatCurrency(stats.net)}
          </p>
        </div>

        {/* Top Category Card */}
        <div className="p-5 rounded-2xl bg-card border border-border card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full tabular-nums">
              {stats.transactionCount} txns
            </span>
          </div>
          <p className="metric-label mb-1">Top Category</p>
          <p className="text-lg font-semibold truncate" title={stats.topCategory.name}>
            {stats.topCategory.name}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {formatCurrency(stats.topCategory.amount)}
          </p>
        </div>
      </div>

      {/* Spending Breakdown */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Spending by Category</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Click a category to filter transactions
          </p>
        </div>
        <div className="p-6">
          <SpendingBreakdown
            onCategoryFilter={handleCategoryFilter}
            selectedCategory={selectedCategory}
          />
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground">
          <TabsTrigger
            value="list"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <PieChart className="w-4 h-4 mr-2" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <TransactionsList
            transactions={filteredTransactions}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="rounded-2xl bg-card border border-border p-6">
            <CategoryBreakdown transactions={filteredTransactions} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
