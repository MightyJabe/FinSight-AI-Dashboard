'use client';

import {
  ArrowRight,
  CreditCard,
  Plus,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { memo, useCallback, useState } from 'react';

import { ConnectBankCTA } from '@/components/dashboard/ConnectBankCTA';
import { NetWorthBreakdown } from '@/components/dashboard/NetWorthBreakdown';
import { NetWorthHero } from '@/components/dashboard/NetWorthHero';
import { ProactiveInsightsCard } from '@/components/dashboard/ProactiveInsightsCard';
import { DashboardSkeleton } from '@/components/ui';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { formatCurrency } from '@/lib/utils';

function DashboardPage() {
  const { overview, loading, error, refetch } = useDashboardData({
    refetchOnFocus: false,
    refetchInterval: 300000,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const data = overview;
  const netWorth = data?.netWorth ?? null;
  const totalAssets = data?.totalAssets ?? 0;
  const totalLiabilities = data?.totalLiabilities ?? 0;
  const accounts = data?.accounts ?? [];

  // Determine primary currency from accounts (most common or first available)
  const primaryCurrency = (() => {
    const accountsWithCurrency = accounts.filter((acc: { currency?: string }) => acc.currency);
    if (accountsWithCurrency.length === 0) return 'USD';
    // Count occurrences of each currency
    const currencyCounts = accountsWithCurrency.reduce((acc: Record<string, number>, account: { currency?: string }) => {
      const curr = account.currency || 'USD';
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    // Return the most common currency
    return Object.entries(currencyCounts).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'USD';
  })();

  // Calculate assets/liabilities by type from accounts
  // This will be properly populated when we integrate with the net-worth endpoint
  const assetsByType: Record<string, number> = {};
  const liabilitiesByType: Record<string, number> = {};

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleConnectBank = useCallback(() => {
    window.location.href = '/accounts?connect=true';
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-6 lg:p-10">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 lg:p-10">
        <div className="max-w-md mx-auto mt-20 p-8 rounded-2xl bg-card border border-border">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-6 h-6 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Unable to load dashboard</h2>
            <p className="text-muted-foreground text-sm mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="mb-8 sm:mb-10 lg:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="animate-in">
            <p className="text-muted-foreground text-xs sm:text-sm font-medium uppercase tracking-wider mb-2">
              Welcome back
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display tracking-tight">
              Your Finances
            </h1>
          </div>
          <Link
            href="/accounts"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95 animate-in delay-75 w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </Link>
        </div>
      </header>

      {/* Net Worth Hero - THE MAIN THING */}
      <section className="mb-6 sm:mb-8 lg:mb-10 animate-in delay-150">
        <NetWorthHero
          netWorth={netWorth}
          previousNetWorth={null}
          lastUpdated={new Date()}
          isLoading={loading}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          currency={primaryCurrency}
        />
      </section>

      {/* Net Worth Breakdown */}
      {data && accounts.length > 0 && (
        <section className="mb-6 sm:mb-8 lg:mb-10 animate-in delay-225">
          <NetWorthBreakdown
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            assetsByType={assetsByType}
            liabilitiesByType={liabilitiesByType}
            currency={primaryCurrency}
          />
        </section>
      )}

      {/* Connect Bank CTA */}
      <section className="mb-6 sm:mb-8 lg:mb-10 animate-in delay-300">
        <ConnectBankCTA
          accountCount={accounts.length}
          onConnect={handleConnectBank}
        />
      </section>

      {/* Connected Accounts */}
      {data && accounts.length > 0 && (
        <section className="mb-6 sm:mb-8 lg:mb-10 animate-in delay-375">
          <div className="p-5 sm:p-6 lg:p-7 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold">Your Accounts</h3>
              <Link
                href="/accounts"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:translate-x-1"
              >
                <span>View all</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {(accounts.slice(0, 4) as Array<{ id: string; name: string; type: string; balance: number; currency?: string }>).map((account, index) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 sm:p-5 rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-all duration-300 hover:translate-x-1 cursor-pointer group"
                  style={{ animationDelay: `${(index + 7) * 50}ms` }}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                      account.type === 'checking'
                        ? 'bg-blue-500/10'
                        : account.type === 'savings'
                          ? 'bg-emerald-500/10'
                          : 'bg-violet-500/10'
                    }`}>
                      <Wallet className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        account.type === 'checking'
                          ? 'text-blue-600 dark:text-blue-400'
                          : account.type === 'savings'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-violet-600 dark:text-violet-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base">{account.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground capitalize">{account.type}</p>
                    </div>
                  </div>
                  <p className="text-base sm:text-lg font-bold tabular-nums">
                    {formatCurrency(account.balance, account.currency || primaryCurrency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI Insights */}
      {data && accounts.length > 0 && (
        <section className="animate-in" style={{ animationDelay: '450ms' }}>
          <ProactiveInsightsCard />
        </section>
      )}
    </div>
  );
}

export default memo(DashboardPage);
