'use client';

import { Activity, AlertTriangle, Bitcoin, DollarSign, Plus, RefreshCw, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { LiveDot, RealTimeBadge, RealTimeIndicator } from '@/components/common/RealTimeIndicator';
import { useRealtimeCrypto } from '@/hooks/use-realtime-crypto';
import { cn } from '@/lib/utils';

const ComprehensiveCryptoPortfolio = dynamic(
  () =>
    import('@/components/crypto/ComprehensiveCryptoPortfolio').then(mod => ({
      default: mod.ComprehensiveCryptoPortfolio,
    })),
  {
    loading: () => <div className="animate-pulse bg-secondary h-96 rounded-2xl" />,
    ssr: false,
  }
);

export default function CryptoPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  // Real-time crypto with 30-second polling (respects API rate limits)
  const {
    data,
    isLoading,
    isValidating,
    isStale,
    refresh,
    lastRefresh,
    totalValue,
    dayChange,
    dayChangePercent,
    isPositive,
  } = useRealtimeCrypto({
    currency: 'USD',
    includeHistorical: true,
  });

  const hasData = data && data.holdings && data.holdings.length > 0;

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen">
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
          {/* Header */}
          <header className="mb-10 animate-in">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-muted-foreground text-sm font-medium">Digital Assets</p>
                  {/* Real-time status */}
                  <RealTimeIndicator
                    lastRefresh={lastRefresh}
                    isValidating={isValidating}
                    isStale={isStale}
                    onRefresh={refresh}
                    variant="compact"
                  />
                </div>
                <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight flex items-center gap-3">
                  <Bitcoin className="h-8 w-8 text-amber-500" />
                  Cryptocurrency Portfolio
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Track your crypto investments with real-time prices and advanced analytics
                </p>
              </div>

              {hasData && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full',
                    'bg-foreground text-background text-sm font-medium',
                    'hover:opacity-90 transition-opacity'
                  )}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Holdings</span>
                </button>
              )}
            </div>
          </header>

          {/* Quick Stats Hero with Real-Time Updates */}
          {hasData && data && (
            <section className="mb-8 animate-in delay-75">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-900 dark:to-black p-6 lg:p-8">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className={cn(
                    'absolute -top-1/2 -right-1/4 w-72 h-72 rounded-full blur-3xl transition-colors duration-500',
                    isPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                  )} />
                  <div className="absolute -bottom-1/2 -left-1/4 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
                </div>

                {/* Real-time badge */}
                <div className="absolute top-4 right-4">
                  <RealTimeBadge isValidating={isValidating} isStale={isStale} />
                </div>

                <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                  {/* Portfolio Value */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-neutral-400 text-sm uppercase tracking-wider">Portfolio Value</p>
                        <LiveDot isLive={!isStale} isStale={isStale} />
                      </div>
                      <p className={cn(
                        'text-2xl font-semibold text-white tabular-nums transition-opacity duration-300',
                        isValidating && 'opacity-70'
                      )}>
                        {formatCurrency(totalValue)}
                      </p>
                    </div>
                  </div>

                  {/* 24h Change */}
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300',
                      isPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                    )}>
                      <TrendingUp className={cn(
                        'w-6 h-6 transition-colors duration-300',
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      )} />
                    </div>
                    <div>
                      <p className="text-neutral-400 text-sm uppercase tracking-wider">24h Change</p>
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          'text-2xl font-semibold tabular-nums transition-all duration-300',
                          isPositive ? 'text-emerald-400' : 'text-rose-400',
                          isValidating && 'opacity-70'
                        )}>
                          {isPositive ? '+' : ''}{formatCurrency(dayChange)}
                        </p>
                        <span className={cn(
                          'text-sm font-medium px-2 py-0.5 rounded-full',
                          isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        )}>
                          {isPositive ? '+' : ''}{dayChangePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Holdings Count */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-neutral-400 text-sm uppercase tracking-wider">Holdings</p>
                      <p className="text-2xl font-semibold text-white tabular-nums">
                        {data.summary?.holdingsCount ?? data.holdings?.length ?? 0}
                      </p>
                    </div>
                  </div>

                  {/* Best Performer */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-neutral-400 text-sm uppercase tracking-wider">Best Performer</p>
                      <p className="text-2xl font-semibold text-white tabular-nums">
                        {data.summary?.topGainer?.symbol || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Last updated and refresh */}
                <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className={cn(
                    'text-xs',
                    isStale ? 'text-amber-400' : 'text-neutral-500'
                  )}>
                    {isStale ? 'Data may be outdated - ' : ''}
                    {lastRefresh ? `Updated ${formatRelativeTime(lastRefresh)}` : 'Loading...'}
                  </span>
                  <button
                    onClick={refresh}
                    disabled={isValidating}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={cn('w-3.5 h-3.5 text-neutral-400', isValidating && 'animate-spin')} />
                    <span className="text-xs text-neutral-400">Refresh</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Risk Alerts */}
          {hasData && data && data.summary && data.summary.diversificationScore < 30 && (
            <div className="mb-6 animate-in delay-100">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="font-medium text-amber-700 dark:text-amber-300">Portfolio Risk Alert</h3>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300/80 mb-3">
                  Your portfolio has low diversification (
                  {data.summary.diversificationScore.toFixed(0)}%). Consider spreading investments
                  across more cryptocurrencies to reduce risk.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-sm bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Diversify Portfolio
                </button>
              </div>
            </div>
          )}

          {/* Main Portfolio Component */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden animate-in delay-150">
            <div className="p-6">
              <ComprehensiveCryptoPortfolio />
            </div>
          </div>

          {/* Educational Note */}
          <div className="mt-8 rounded-2xl bg-blue-500/10 border border-blue-500/20 p-6 animate-in delay-200">
            <h3 className="font-semibold text-foreground mb-4">Cryptocurrency Investment Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-medium text-foreground mb-1">Diversification</h4>
                <p>
                  Spread investments across different cryptocurrencies, market caps, and use cases.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">Dollar-Cost Averaging</h4>
                <p>Invest fixed amounts regularly to reduce the impact of volatility.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">Research</h4>
                <p>Understand the technology, team, and use case before investing.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">Risk Management</h4>
                <p>Only invest what you can afford to lose. Crypto is highly volatile.</p>
              </div>
            </div>
          </div>

          {/* Add Holdings Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl animate-in">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Add Crypto Holdings
                </h3>
                <p className="text-muted-foreground mb-6">
                  To add crypto holdings, connect your exchange accounts or manually add platforms
                  in the Investments section.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-muted-foreground bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <a
                    href="/investments"
                    className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors"
                  >
                    Go to Investments
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

/**
 * Format relative time for display
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return date.toLocaleDateString();
}
