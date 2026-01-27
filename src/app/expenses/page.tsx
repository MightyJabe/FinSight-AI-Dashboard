'use client';

import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Flame,
  Lightbulb,
  PiggyBank,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Skeleton } from '@/components/common/SkeletonLoader';
import { Button } from '@/components/ui/button';
import { useExpenseAnalysis } from '@/hooks/use-expense-analysis';
import type {
  OptimizationOpportunity,
  SpendingBenchmark,
  SpendingCategory,
} from '@/lib/services/expense-optimizer';
import { cn, formatCurrency } from '@/lib/utils';

// Category icons
const categoryIcons: Record<string, typeof Wallet> = {
  'Housing': DollarSign,
  'Transportation': Zap,
  'Food & Dining': Flame,
  'Entertainment': Sparkles,
  'Shopping': Wallet,
  'Utilities': Zap,
  'Healthcare': Target,
  'Subscriptions': RefreshCw,
};

function ExpenseHero({
  totalSpending,
  savingsGoal,
  projectedSavings,
  isLoading,
  onRefresh,
  isRefreshing,
  monthlyIncome,
}: {
  totalSpending: number;
  savingsGoal: number;
  projectedSavings: number;
  isLoading: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  monthlyIncome: number;
}) {
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - totalSpending) / monthlyIncome) * 100 : 0;
  const isOnTrack = savingsRate >= 20;

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-950 p-10 lg:p-14">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10">
          <Skeleton className="h-4 w-36 mb-4 bg-white/10" />
          <Skeleton className="h-20 w-64 mb-6 bg-white/10" />
          <div className="flex gap-4">
            <Skeleton className="h-24 w-40 rounded-2xl bg-white/10" />
            <Skeleton className="h-24 w-40 rounded-2xl bg-white/10" />
            <Skeleton className="h-24 w-40 rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-950 p-10 lg:p-14">
      {/* Decorative glows */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            'absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full blur-[120px]',
            isOnTrack ? 'bg-emerald-500/30' : 'bg-amber-500/30'
          )}
        />
        <div className="absolute -bottom-1/2 -left-1/4 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-0 left-1/2 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[80px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="flex-1">
            <p className="text-teal-300/80 text-sm font-semibold uppercase tracking-[0.2em] mb-4">
              Monthly Expenses
            </p>
            <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-none mb-6">
              {formatCurrency(totalSpending, 'USD')}
            </h2>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4">
              <div className="px-5 py-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <p className="text-teal-200/70 text-xs font-medium uppercase tracking-wider mb-1">
                  Savings Rate
                </p>
                <div className="flex items-center gap-2">
                  {isOnTrack ? (
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-amber-400" />
                  )}
                  <p
                    className={cn(
                      'text-xl font-bold tabular-nums',
                      isOnTrack ? 'text-emerald-400' : 'text-amber-400'
                    )}
                  >
                    {savingsRate.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="px-5 py-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <p className="text-teal-200/70 text-xs font-medium uppercase tracking-wider mb-1">
                  Savings Goal
                </p>
                <p className="text-white text-xl font-bold tabular-nums">
                  {formatCurrency(savingsGoal, 'USD')}
                </p>
              </div>
              <div className="px-5 py-3.5 rounded-2xl bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30">
                <p className="text-emerald-200/70 text-xs font-medium uppercase tracking-wider mb-1">
                  Can Save
                </p>
                <p className="text-emerald-400 text-xl font-bold tabular-nums">
                  {formatCurrency(projectedSavings, 'USD')}
                </p>
              </div>
            </div>
          </div>

          {/* Refresh button */}
          <div className="flex items-center gap-4">
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              variant="gradient"
              size="lg"
              className="rounded-full"
              leftIcon={<RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />}
            >
              {isRefreshing ? 'Analyzing...' : 'Refresh Analysis'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryBreakdownCard({ categories }: { categories: SpendingCategory[] }) {
  const total = useMemo(
    () => categories.reduce((sum, c) => sum + c.amount, 0),
    [categories]
  );

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="gradient-text text-sm font-semibold uppercase tracking-wider mb-5 flex items-center gap-2">
        <Wallet className="w-4 h-4" />
        Spending by Category
      </h3>
      <div className="space-y-4">
        {categories.slice(0, 6).map((cat) => {
          const Icon = categoryIcons[cat.category] || Wallet;
          const percentage = total > 0 ? (cat.amount / total) * 100 : 0;

          return (
            <div key={cat.category} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                    <Icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-foreground text-sm font-medium">{cat.category}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{cat.transactionCount} transactions</span>
                      {cat.trend === 'increasing' && (
                        <span className="flex items-center text-amber-400">
                          <ArrowUp className="w-3 h-3" /> Up
                        </span>
                      )}
                      {cat.trend === 'decreasing' && (
                        <span className="flex items-center text-emerald-400">
                          <ArrowDown className="w-3 h-3" /> Down
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-foreground font-semibold tabular-nums">
                  {formatCurrency(cat.amount, 'USD')}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BenchmarkCard({ benchmarks }: { benchmarks: SpendingBenchmark[] }) {
  const aboveBenchmark = benchmarks.filter((b) => b.status === 'above');
  const belowBenchmark = benchmarks.filter((b) => b.status === 'below');

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="gradient-text text-sm font-semibold uppercase tracking-wider mb-5 flex items-center gap-2">
        <Target className="w-4 h-4" />
        vs Israeli Average
      </h3>

      {aboveBenchmark.length > 0 && (
        <div className="mb-5">
          <p className="text-amber-400 text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Above Average ({aboveBenchmark.length})
          </p>
          <div className="space-y-2">
            {aboveBenchmark.slice(0, 3).map((b) => (
              <div
                key={b.category}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
              >
                <span className="text-foreground text-sm">{b.category}</span>
                <span className="text-amber-400 text-sm font-semibold">
                  +{b.percentageDiff.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {belowBenchmark.length > 0 && (
        <div>
          <p className="text-emerald-400 text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Below Average ({belowBenchmark.length})
          </p>
          <div className="space-y-2">
            {belowBenchmark.slice(0, 3).map((b) => (
              <div
                key={b.category}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
              >
                <span className="text-foreground text-sm">{b.category}</span>
                <span className="text-emerald-400 text-sm font-semibold">
                  {b.percentageDiff.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {aboveBenchmark.length === 0 && belowBenchmark.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-4">
          Your spending is at the average level across all categories.
        </p>
      )}
    </div>
  );
}

function OpportunityCard({ opportunity }: { opportunity: OptimizationOpportunity }) {
  const [expanded, setExpanded] = useState(false);

  const priorityColors = {
    high: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  const difficultyIcons = {
    easy: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    medium: <Target className="w-4 h-4 text-amber-400" />,
    hard: <Flame className="w-4 h-4 text-rose-400" />,
  };

  return (
    <div
      className={cn(
        'glass-card rounded-2xl card-hover cursor-pointer'
      )}
    >
      <div
        className="p-6"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Lightbulb className="w-6 h-6 text-blue-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                  priorityColors[opportunity.priority]
                )}
              >
                {opportunity.priority}
              </span>
              <span className="text-muted-foreground text-xs capitalize">{opportunity.type}</span>
            </div>

            <h4 className="text-foreground font-semibold text-lg mb-2">{opportunity.title}</h4>
            <p className="text-muted-foreground text-sm line-clamp-2">{opportunity.description}</p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-emerald-400 font-bold text-xl tabular-nums">
              {formatCurrency(opportunity.potentialSavings, 'USD')}
            </p>
            <p className="text-muted-foreground text-xs">potential savings</p>
          </div>

          <ChevronRight
            className={cn(
              'w-5 h-5 text-muted-foreground transition-transform',
              expanded && 'rotate-90'
            )}
          />
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-6 border-t border-border pt-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {difficultyIcons[opportunity.difficulty]}
              <span className="capitalize">{opportunity.difficulty} to implement</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">
              Action Steps:
            </p>
            {opportunity.actionItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 px-3 py-2 rounded-lg bg-muted/50"
              >
                <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-foreground text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] glass-card-strong p-12 lg:p-16 text-center">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-8">
          <PiggyBank className="w-10 h-10 text-blue-400" />
        </div>
        <h2 className="text-3xl lg:text-4xl font-display gradient-text tracking-tight mb-5">
          Start Optimizing Your Expenses
        </h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto mb-10 leading-relaxed">
          Connect your accounts and add transactions to get personalized expense optimization
          recommendations.
        </p>
      </div>
    </div>
  );
}

function ExpensesPageContent() {
  const { analysis, meta, isLoading, isRefreshing, error, refresh } = useExpenseAnalysis({
    months: 3,
    savingsGoalPercent: 20,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen px-4 py-8 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ExpenseHero
            totalSpending={0}
            savingsGoal={0}
            projectedSavings={0}
            isLoading={true}
            onRefresh={() => {}}
            isRefreshing={false}
            monthlyIncome={0}
          />
        </div>
      </div>
    );
  }

  const hasData = analysis && analysis.categoryBreakdown.length > 0;

  return (
    <div className="min-h-screen px-4 py-8 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display gradient-text tracking-tight mb-2">
              Expense Optimizer
            </h1>
            <p className="text-muted-foreground">
              AI-powered insights to reduce spending and increase savings
            </p>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="glass-card border-rose-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
        )}

        {!hasData ? (
          <EmptyState />
        ) : (
          <>
            {/* Hero section */}
            <ExpenseHero
              totalSpending={analysis.totalSpending}
              savingsGoal={analysis.savingsGoal}
              projectedSavings={analysis.projectedSavings}
              isLoading={false}
              onRefresh={refresh}
              isRefreshing={isRefreshing}
              monthlyIncome={meta?.monthlyIncome || 0}
            />

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Opportunities list */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold gradient-text flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-400" />
                    Optimization Opportunities
                  </h2>
                  <span className="text-muted-foreground text-sm">
                    {analysis.opportunities.length} found
                  </span>
                </div>

                <div className="space-y-4">
                  {analysis.opportunities.map((opp) => (
                    <OpportunityCard key={opp.id} opportunity={opp} />
                  ))}
                </div>

                {analysis.opportunities.length === 0 && (
                  <div className="text-center py-12 glass-card rounded-2xl">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <p className="text-foreground font-medium mb-2">Great job!</p>
                    <p className="text-muted-foreground">
                      No major optimization opportunities found. Your spending looks healthy.
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <CategoryBreakdownCard categories={analysis.categoryBreakdown} />
                <BenchmarkCard benchmarks={analysis.benchmarks} />

                {/* Summary card */}
                <div className="glass-card-strong rounded-2xl p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                      <PiggyBank className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="gradient-text font-semibold">Summary</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Analyzed Period</span>
                      <span className="text-foreground font-medium">{meta?.months} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transactions</span>
                      <span className="text-foreground font-medium">{meta?.transactionCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categories</span>
                      <span className="text-foreground font-medium">
                        {analysis.categoryBreakdown.length}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="text-muted-foreground">Total Potential Savings</span>
                      <span className="text-emerald-400 font-bold">
                        {formatCurrency(analysis.projectedSavings, 'USD')}/mo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  return <ExpensesPageContent />;
}
