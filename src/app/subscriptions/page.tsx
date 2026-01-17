'use client';

import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Calendar,
  CreditCard,
  DollarSign,
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  TrendingUp,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Skeleton } from '@/components/common/SkeletonLoader';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { cn, formatCurrency } from '@/lib/utils';
import type { Subscription } from '@/types/subscription';

// Category icons and colors
type CategoryConfigType = { icon: typeof Sparkles; color: string; bgColor: string };

const defaultCategoryConfig: CategoryConfigType = {
  icon: Tag,
  color: 'text-neutral-400',
  bgColor: 'bg-neutral-500/20'
};

const categoryConfig: Record<string, CategoryConfigType> = {
  entertainment: { icon: Sparkles, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  streaming: { icon: Sparkles, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  software: { icon: CreditCard, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  utilities: { icon: DollarSign, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  fitness: { icon: TrendingUp, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  food: { icon: Tag, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  news: { icon: Bell, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  other: defaultCategoryConfig,
};

function getCategoryConfig(category: string): CategoryConfigType {
  const normalized = category.toLowerCase();
  return categoryConfig[normalized] ?? defaultCategoryConfig;
}

function SubscriptionHero({
  totalMonthly,
  totalYearly,
  activeCount,
  isLoading,
  onDetect,
  isDetecting,
}: {
  totalMonthly: number;
  totalYearly: number;
  activeCount: number;
  isLoading: boolean;
  onDetect: () => void;
  isDetecting: boolean;
}) {
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-950 p-10 lg:p-14">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[100px]" />
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
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-950 p-10 lg:p-14">
      {/* Decorative glows */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] bg-violet-500/30 rounded-full blur-[120px]" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[500px] h-[500px] bg-fuchsia-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-0 left-1/2 w-[300px] h-[300px] bg-pink-500/10 rounded-full blur-[80px]" />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="flex-1">
            <p className="text-violet-300/80 text-sm font-semibold uppercase tracking-[0.2em] mb-4">
              Monthly Subscriptions
            </p>
            <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-none mb-6">
              {formatCurrency(totalMonthly, 'USD')}
              <span className="text-violet-300/60 text-2xl sm:text-3xl font-normal ml-3">/mo</span>
            </h2>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4">
              <div className="px-5 py-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <p className="text-violet-200/70 text-xs font-medium uppercase tracking-wider mb-1">
                  Yearly Cost
                </p>
                <p className="text-white text-xl font-bold tabular-nums">
                  {formatCurrency(totalYearly, 'USD')}
                </p>
              </div>
              <div className="px-5 py-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <p className="text-violet-200/70 text-xs font-medium uppercase tracking-wider mb-1">
                  Active
                </p>
                <p className="text-white text-xl font-bold tabular-nums">
                  {activeCount} <span className="text-violet-300/60 text-sm font-normal">subscriptions</span>
                </p>
              </div>
              <div className="px-5 py-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <p className="text-violet-200/70 text-xs font-medium uppercase tracking-wider mb-1">
                  Avg / Sub
                </p>
                <p className="text-white text-xl font-bold tabular-nums">
                  {activeCount > 0 ? formatCurrency(totalMonthly / activeCount, 'USD') : '$0'}
                </p>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-4">
            <button
              onClick={onDetect}
              disabled={isDetecting}
              className={cn(
                'group flex items-center gap-3 px-8 py-4 rounded-full text-sm font-semibold transition-all duration-300',
                'bg-white text-violet-900 hover:bg-violet-100 hover:scale-105 active:scale-100',
                'shadow-xl shadow-violet-900/40 hover:shadow-2xl hover:shadow-violet-900/50',
                'disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100'
              )}
            >
              <RefreshCw className={cn('w-4 h-4', isDetecting && 'animate-spin')} />
              {isDetecting ? 'Scanning...' : 'Detect Subscriptions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryBreakdown({ categories }: { categories: Record<string, number> }) {
  const sortedCategories = useMemo(() => {
    return Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
  }, [categories]);

  const total = useMemo(() => {
    return Object.values(categories).reduce((sum, val) => sum + val, 0);
  }, [categories]);

  if (sortedCategories.length === 0) return null;

  return (
    <div className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800/50">
      <h3 className="text-neutral-400 text-sm font-semibold uppercase tracking-wider mb-5">
        Spending by Category
      </h3>
      <div className="space-y-4">
        {sortedCategories.map(([category, amount]) => {
          const config = getCategoryConfig(category);
          const Icon = config.icon;
          const percentage = total > 0 ? (amount / total) * 100 : 0;

          return (
            <div key={category} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', config.bgColor)}>
                    <Icon className={cn('w-4 h-4', config.color)} />
                  </div>
                  <span className="text-neutral-200 text-sm font-medium capitalize">{category}</span>
                </div>
                <span className="text-white font-semibold tabular-nums">
                  {formatCurrency(amount, 'USD')}
                </span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%`, backgroundColor: config.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubscriptionCard({
  subscription,
  onCancel,
}: {
  subscription: Subscription;
  onCancel?: (id: string) => void;
}) {
  const config = getCategoryConfig(subscription.category);
  const Icon = config.icon;

  const { hasPriceIncrease, priceIncrease } = useMemo(() => {
    if (subscription.priceHistory.length < 2) {
      return { hasPriceIncrease: false, priceIncrease: 0 };
    }
    const recent = subscription.priceHistory[subscription.priceHistory.length - 1];
    const previous = subscription.priceHistory[subscription.priceHistory.length - 2];
    if (!recent || !previous) {
      return { hasPriceIncrease: false, priceIncrease: 0 };
    }
    const hasIncrease = recent.amount > previous.amount;
    return {
      hasPriceIncrease: hasIncrease,
      priceIncrease: hasIncrease ? recent.amount - previous.amount : 0,
    };
  }, [subscription.priceHistory]);

  return (
    <div className="group relative bg-neutral-900/60 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800/50 hover:border-neutral-700/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/20">
      {/* Status indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {hasPriceIncrease && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />
            +{formatCurrency(priceIncrease, 'USD')}
          </div>
        )}
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full',
            subscription.status === 'active'
              ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50'
              : subscription.status === 'paused'
                ? 'bg-amber-400 shadow-lg shadow-amber-400/50'
                : 'bg-neutral-500'
          )}
        />
      </div>

      {/* Main content */}
      <div className="flex items-start gap-4">
        <div className={cn('p-3 rounded-xl', config.bgColor)}>
          <Icon className={cn('w-6 h-6', config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-lg truncate mb-1">
            {subscription.merchant}
          </h4>
          <p className="text-neutral-400 text-sm capitalize">{subscription.category}</p>
        </div>

        <div className="text-right">
          <p className="text-white font-bold text-2xl tabular-nums">
            {formatCurrency(subscription.amount, 'USD')}
          </p>
          <p className="text-neutral-500 text-xs font-medium">
            per {subscription.frequency === 'monthly' ? 'month' : subscription.frequency === 'yearly' ? 'year' : 'week'}
          </p>
        </div>
      </div>

      {/* Details row */}
      <div className="flex items-center gap-6 mt-5 pt-4 border-t border-neutral-800/50">
        <div className="flex items-center gap-2 text-neutral-400 text-sm">
          <Calendar className="w-4 h-4" />
          <span>Next: {subscription.nextCharge}</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-400 text-sm">
          <CreditCard className="w-4 h-4" />
          <span>{subscription.transactionIds.length} charges</span>
        </div>
      </div>

      {/* Price history */}
      {subscription.priceHistory.length > 1 && (
        <div className="mt-4 pt-4 border-t border-neutral-800/50">
          <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider mb-3">
            Price History
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {subscription.priceHistory.slice(-5).map((ph, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50"
              >
                <p className="text-white text-sm font-medium tabular-nums">
                  {formatCurrency(ph.amount, 'USD')}
                </p>
                <p className="text-neutral-500 text-xs">{ph.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mt-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {subscription.cancellationUrl && (
          <a
            href={subscription.cancellationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Manage
          </a>
        )}
        {subscription.cancellable && onCancel && (
          <button
            onClick={() => onCancel(subscription.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onDetect, isDetecting }: { onDetect: () => void; isDetecting: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-12 lg:p-16 text-center">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-violet-500/20 mb-8">
          <Sparkles className="w-10 h-10 text-violet-400" />
        </div>
        <h2 className="text-3xl lg:text-4xl font-display text-white tracking-tight mb-5">
          Discover Your Subscriptions
        </h2>
        <p className="text-neutral-400 text-lg max-w-md mx-auto mb-10 leading-relaxed">
          We&apos;ll analyze your transactions to find recurring charges and help you track your subscription spending.
        </p>
        <button
          onClick={onDetect}
          disabled={isDetecting}
          className={cn(
            'inline-flex items-center gap-3 px-10 py-5 rounded-full text-base font-semibold transition-all duration-300',
            'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white',
            'hover:from-violet-500 hover:to-fuchsia-500 hover:scale-105 active:scale-100',
            'shadow-xl shadow-violet-900/40 hover:shadow-2xl hover:shadow-violet-900/50',
            'disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100'
          )}
        >
          <Search className="w-5 h-5" />
          {isDetecting ? 'Scanning Transactions...' : 'Scan My Transactions'}
        </button>
      </div>
    </div>
  );
}

function SubscriptionsPageContent() {
  const { subscriptions, summary, isLoading, isDetecting, error, detectSubscriptions, cancelSubscription } =
    useSubscriptions();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter(sub => sub.status === 'active')
      .filter(sub => {
        if (searchQuery) {
          return sub.merchant.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
      .filter(sub => {
        if (filterCategory) {
          return sub.category.toLowerCase() === filterCategory.toLowerCase();
        }
        return true;
      })
      .sort((a, b) => b.amount - a.amount);
  }, [subscriptions, searchQuery, filterCategory]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(subscriptions.map(s => s.category));
    return Array.from(cats);
  }, [subscriptions]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 px-4 py-8 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <SubscriptionHero
            totalMonthly={0}
            totalYearly={0}
            activeCount={0}
            isLoading={true}
            onDetect={() => {}}
            isDetecting={false}
          />
        </div>
      </div>
    );
  }

  const hasSubscriptions = subscriptions.length > 0;

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display text-white tracking-tight mb-2">
              Subscriptions
            </h1>
            <p className="text-neutral-400">
              Track and manage your recurring charges
            </p>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <p className="text-rose-300 text-sm">{error}</p>
          </div>
        )}

        {!hasSubscriptions ? (
          <EmptyState onDetect={detectSubscriptions} isDetecting={isDetecting} />
        ) : (
          <>
            {/* Hero section */}
            <SubscriptionHero
              totalMonthly={summary.totalMonthly}
              totalYearly={summary.totalYearly}
              activeCount={summary.activeCount}
              isLoading={false}
              onDetect={detectSubscriptions}
              isDetecting={isDetecting}
            />

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Subscriptions list */}
              <div className="lg:col-span-2 space-y-6">
                {/* Search and filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Search subscriptions..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-neutral-900/50 border border-neutral-800/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-colors"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                      onClick={() => setFilterCategory(null)}
                      className={cn(
                        'px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                        filterCategory === null
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          : 'bg-neutral-800/50 text-neutral-400 hover:text-white border border-transparent'
                      )}
                    >
                      All
                    </button>
                    {uniqueCategories.slice(0, 4).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat === filterCategory ? null : cat)}
                        className={cn(
                          'px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap capitalize transition-colors',
                          filterCategory === cat
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                            : 'bg-neutral-800/50 text-neutral-400 hover:text-white border border-transparent'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subscriptions grid */}
                <div className="grid gap-4">
                  {filteredSubscriptions.map(sub => (
                    <SubscriptionCard
                      key={sub.id}
                      subscription={sub}
                      onCancel={cancelSubscription}
                    />
                  ))}
                </div>

                {filteredSubscriptions.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-neutral-500">No subscriptions match your filters.</p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <CategoryBreakdown categories={summary.categories} />

                {/* Savings tip card */}
                <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 backdrop-blur-sm rounded-2xl p-6 border border-emerald-800/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-emerald-300 font-semibold">Savings Tip</h3>
                  </div>
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    You&apos;re spending{' '}
                    <span className="text-emerald-400 font-semibold">
                      {formatCurrency(summary.totalYearly, 'USD')}
                    </span>{' '}
                    per year on subscriptions. Consider reviewing unused services to save money.
                  </p>
                  <button className="flex items-center gap-2 mt-4 text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                    View Recommendations
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  return <SubscriptionsPageContent />;
}
