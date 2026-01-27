'use client';

import {
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';

import { LiveDot, RealTimeBadge } from '@/components/common/RealTimeIndicator';
import { Skeleton } from '@/components/common/SkeletonLoader';
import type { NetWorthTrend } from '@/hooks/use-net-worth';
import { cn, formatCurrency } from '@/lib/utils';

interface NetWorthHeroProps {
  netWorth: number | null;
  previousNetWorth?: number | null;
  trend?: NetWorthTrend | null;
  lastUpdated: Date | null;
  isLoading: boolean;
  isValidating?: boolean;
  isStale?: boolean;
  onRefresh: () => void;
  isRefreshing?: boolean;
  currency?: string;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

/**
 * Animated counter hook for smooth number transitions
 */
function useAnimatedValue(value: number, duration: number = 1000) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeOutExpo)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const currentValue = startValue + (endValue - startValue) * eased;
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return displayValue;
}

function NetWorthHeroSkeleton() {
  return (
    <div className="@container">
      <div className="relative overflow-hidden rounded-[2rem] glass-card-strong p-10 @lg:p-14">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col @lg:flex-row @lg:items-end @lg:justify-between gap-10">
            <div className="flex-1">
              <Skeleton className="h-4 w-36 mb-4 bg-neutral-700/50" />
              <Skeleton className="h-20 @lg:h-28 w-80 @lg:w-96 mb-6 bg-neutral-700/50" />
              <Skeleton className="h-5 w-48 bg-neutral-700/50" />
            </div>
            <div className="flex items-end gap-1.5 h-24 opacity-30">
              {Array.from({ length: 14 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="w-4 @lg:w-5 rounded-t-sm bg-neutral-700/50"
                  style={{ height: `${Math.random() * 60 + 30}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onConnect }: { onConnect?: () => void }) {
  return (
    <div className="@container">
      <div className="relative overflow-hidden rounded-[2rem] glass-card-strong p-10 @lg:p-14">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] bg-neutral-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 text-center py-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-700/30 mb-6">
            <Sparkles className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-400 text-sm font-medium uppercase tracking-[0.2em] mb-4">
            Total Net Worth
          </p>
          <h2 className="text-4xl @lg:text-5xl font-display text-neutral-500 tracking-tight mb-5">
            No Data Available
          </h2>
          <p className="text-neutral-500 text-base max-w-md mx-auto mb-8 leading-relaxed">
            Connect your bank accounts to see your total net worth and financial overview.
          </p>
          {onConnect && (
            <button
              onClick={onConnect}
              className="px-8 py-3.5 bg-white text-neutral-900 rounded-full text-sm font-semibold hover:bg-neutral-100 hover:scale-105 active:scale-100 transition-all duration-200 shadow-lg shadow-white/10"
            >
              Connect Bank Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NetWorthHeroComponent({
  netWorth,
  previousNetWorth,
  trend,
  lastUpdated,
  isLoading,
  isValidating = false,
  isStale = false,
  onRefresh,
  isRefreshing = false,
  currency = 'USD',
}: NetWorthHeroProps) {
  const animatedNetWorth = useAnimatedValue(netWorth ?? 0, 800);

  if (isLoading) {
    return <NetWorthHeroSkeleton />;
  }

  if (netWorth === null) {
    return <EmptyState />;
  }

  // Use trend data if available, otherwise fall back to previousNetWorth comparison
  const change = trend?.monthly ?? (previousNetWorth != null ? netWorth - previousNetWorth : null);
  const changePercent =
    trend?.monthlyPercent ??
    (previousNetWorth != null && previousNetWorth !== 0 && change != null
      ? (change / Math.abs(previousNetWorth)) * 100
      : null);
  const isPositive = (change ?? 0) >= 0;

  // Generate mini chart data based on trend
  const chartData = trend
    ? generateChartFromTrend(trend, isPositive)
    : [40, 55, 45, 60, 52, 70, 65, 80, 75, 90, 85, 95, 88, 92];

  return (
    <div className="@container">
      <div className="relative overflow-hidden rounded-[2rem] glass-card-strong p-10 @lg:p-14">
        {/* Premium background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Main glow based on performance */}
          <div
            className={cn(
              'absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full blur-[120px] transition-colors duration-1000',
              isPositive ? 'bg-blue-500/25' : 'bg-rose-500/20'
            )}
          />
          {/* Secondary accent glow */}
          <div className="absolute -bottom-1/2 -left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px]" />
          {/* Tertiary subtle glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[80px]" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          {/* Radial gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <div className="relative z-10">
          {/* Real-time status badge */}
          <div className="absolute top-0 right-0">
            <RealTimeBadge isValidating={isValidating || isRefreshing} isStale={isStale} />
          </div>

          <div className="flex flex-col @3xl:flex-row @3xl:items-end @3xl:justify-between gap-10 @3xl:gap-16">
            <div className="flex-1">
              {/* Label with live indicator */}
              <div className="flex items-center gap-3 mb-5">
                <p className="text-neutral-400 text-sm font-semibold uppercase tracking-[0.2em]">
                  Total Net Worth
                </p>
                <LiveDot isLive={!isStale} isStale={isStale} />
              </div>

              {/* Main value - THE BIG NUMBER */}
              <h2
                className={cn(
                  'font-display text-6xl sm:text-7xl @lg:text-8xl @3xl:text-[6.5rem] text-foreground tracking-tight tabular-nums leading-none transition-opacity duration-300',
                  isValidating && 'opacity-70'
                )}
              >
                {formatCurrency(Math.round(animatedNetWorth), currency)}
              </h2>

            {/* Change indicator - prominent and clear */}
            {change !== null && (
              <div className="flex flex-wrap items-center gap-4 mt-6">
                <div
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold',
                    isPositive
                      ? 'bg-blue-500/25 text-blue-300 ring-1 ring-blue-400/30'
                      : 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30'
                  )}
                >
                  {isPositive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span className="tabular-nums">
                    {isPositive ? '+' : ''}
                    {formatCurrency(change, currency)}
                  </span>
                  {changePercent !== null && (
                    <span className="opacity-75 tabular-nums">
                      ({changePercent > 0 ? '+' : ''}
                      {changePercent.toFixed(1)}%)
                    </span>
                  )}
                </div>
                <span className="text-neutral-500 text-sm font-medium">vs last month</span>
              </div>
            )}

            {/* Trend badges - daily/weekly changes */}
            {trend && (
              <div className="flex flex-wrap items-center gap-2.5 mt-5">
                <TrendBadge label="Day" value={trend.daily} percent={trend.dailyPercent} />
                <TrendBadge label="Week" value={trend.weekly} percent={trend.weeklyPercent} />
              </div>
            )}

            {/* Refresh and last updated */}
            <div className="flex items-center gap-3 mt-6">
              {lastUpdated && (
                <span className={cn('text-xs font-medium', isStale ? 'text-amber-400' : 'text-neutral-500')}>
                  {isStale ? 'Data may be outdated - ' : ''}Updated {formatRelativeTime(lastUpdated)}
                </span>
              )}
              <button
                onClick={onRefresh}
                disabled={isRefreshing || isValidating}
                className="p-2 rounded-full hover:bg-white/10 transition-all duration-200 disabled:opacity-50 hover:scale-110 active:scale-95"
                aria-label="Refresh data"
              >
                <RefreshCw
                  className={cn(
                    'w-4 h-4 text-neutral-400',
                    (isRefreshing || isValidating) && 'animate-spin'
                  )}
                />
              </button>
            </div>
          </div>

          {/* Mini Chart - visual trend */}
          <div className="flex items-end gap-1.5 h-24 @lg:h-28">
            {chartData.map((h, i) => (
              <div
                key={i}
                className={cn(
                  'w-4 @lg:w-5 rounded-t transition-all duration-500 ease-out',
                  isPositive
                    ? 'bg-gradient-to-t from-blue-600/70 via-purple-500/60 to-blue-400'
                    : 'bg-gradient-to-t from-rose-600/60 to-rose-400'
                )}
                style={{
                  height: `${h}%`,
                  transitionDelay: `${i * 30}ms`,
                  opacity: 0.4 + (i / chartData.length) * 0.6,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

/**
 * Small trend badge for daily/weekly changes
 */
function TrendBadge({
  label,
  value,
  percent,
}: {
  label: string;
  value: number;
  percent: number;
}) {
  const isPositive = value >= 0;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105',
        isPositive
          ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/25'
          : 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
      )}
    >
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      <span>{label}:</span>
      <span className="tabular-nums">
        {isPositive ? '+' : ''}
        {percent.toFixed(1)}%
      </span>
    </div>
  );
}

/**
 * Generate chart data from trend (simulated based on growth direction)
 */
function generateChartFromTrend(trend: NetWorthTrend, isPositive: boolean): number[] {
  const baseValues = [30, 35, 32, 40, 38, 45, 42, 50, 48, 55, 52, 58, 55, 62];
  const direction = isPositive ? 1 : -1;
  const volatility = Math.abs(trend.weeklyPercent) / 10;

  return baseValues.map((base, i) => {
    const growth = (i / baseValues.length) * 40 * direction;
    const noise = (Math.random() - 0.5) * volatility * 10;
    return Math.max(20, Math.min(95, base + growth + noise));
  });
}

export const NetWorthHero = memo(NetWorthHeroComponent);
