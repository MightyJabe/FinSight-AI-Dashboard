'use client';

import { ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react';

import { Skeleton } from '@/components/common/SkeletonLoader';
import { cn, formatCurrency } from '@/lib/utils';

interface NetWorthHeroProps {
  netWorth: number | null;
  previousNetWorth: number | null;
  lastUpdated: Date | null;
  isLoading: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  currency?: string;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function NetWorthHeroSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-900 dark:to-black p-8 lg:p-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <Skeleton className="h-4 w-32 mb-3 bg-neutral-700" />
            <Skeleton className="h-16 w-72 mb-4 bg-neutral-700" />
            <Skeleton className="h-5 w-40 bg-neutral-700" />
          </div>
          <div className="flex items-end gap-1 h-20 opacity-40">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="w-3 lg:w-4 rounded-t bg-neutral-700"
                style={{ height: `${Math.random() * 60 + 30}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onConnect }: { onConnect?: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-900 dark:to-black p-8 lg:p-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-neutral-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center py-8">
        <p className="text-neutral-400 text-sm font-medium uppercase tracking-widest mb-3">
          Total Net Worth
        </p>
        <h2 className="text-3xl lg:text-4xl font-semibold text-neutral-500 tracking-tight mb-4">
          No Data Available
        </h2>
        <p className="text-neutral-500 text-sm max-w-md mx-auto mb-6">
          Connect your bank accounts to see your total net worth and financial overview.
        </p>
        {onConnect && (
          <button
            onClick={onConnect}
            className="px-6 py-2.5 bg-white text-neutral-900 rounded-full text-sm font-medium hover:bg-neutral-100 transition-colors"
          >
            Connect Bank Account
          </button>
        )}
      </div>
    </div>
  );
}

export function NetWorthHero({
  netWorth,
  previousNetWorth,
  lastUpdated,
  isLoading,
  onRefresh,
  isRefreshing,
  currency = 'USD',
}: NetWorthHeroProps) {
  if (isLoading) {
    return <NetWorthHeroSkeleton />;
  }

  if (netWorth === null) {
    return <EmptyState />;
  }

  const change = previousNetWorth !== null ? netWorth - previousNetWorth : null;
  const changePercent =
    previousNetWorth !== null && previousNetWorth !== 0
      ? ((change ?? 0) / Math.abs(previousNetWorth)) * 100
      : null;
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-900 dark:to-black p-8 lg:p-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            'absolute -top-1/2 -right-1/4 w-96 h-96 rounded-full blur-3xl',
            isPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20'
          )}
        />
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <p className="text-neutral-400 text-sm font-medium uppercase tracking-widest mb-3">
              Total Net Worth
            </p>
            <h2 className="font-display text-5xl lg:text-7xl text-white tracking-tight tabular-nums">
              {formatCurrency(netWorth, currency)}
            </h2>

            {change !== null && (
              <div className="flex items-center gap-3 mt-4">
                <span
                  className={cn(
                    'flex items-center gap-1.5 text-sm font-medium',
                    isPositive
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  )}
                >
                  {isPositive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {isPositive ? '+' : ''}
                  {formatCurrency(change, currency)}
                </span>
                {changePercent !== null && (
                  <span className="text-neutral-500 text-sm">
                    ({changePercent > 0 ? '+' : ''}
                    {changePercent.toFixed(1)}%)
                  </span>
                )}
                <span className="text-neutral-500 text-sm">vs last month</span>
              </div>
            )}

            {/* Refresh and last updated */}
            <div className="flex items-center gap-3 mt-4">
              {lastUpdated && (
                <span className="text-neutral-500 text-xs">
                  Updated {formatRelativeTime(lastUpdated)}
                </span>
              )}
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
                aria-label="Refresh data"
              >
                <RefreshCw
                  className={cn(
                    'w-3.5 h-3.5 text-neutral-400',
                    isRefreshing && 'animate-spin'
                  )}
                />
              </button>
            </div>
          </div>

          {/* Mini Chart Placeholder */}
          <div className="flex items-end gap-1 h-20 opacity-60">
            {[40, 55, 45, 60, 52, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
              <div
                key={i}
                className={cn(
                  'w-3 lg:w-4 rounded-t bg-gradient-to-t',
                  isPositive
                    ? 'from-emerald-500/50 to-emerald-400'
                    : 'from-rose-500/50 to-rose-400'
                )}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
