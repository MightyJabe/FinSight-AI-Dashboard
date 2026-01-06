'use client';

import {
  ArrowRight,
  CreditCard,
  Plus,
  Sparkles,
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
import { useUserSettings } from '@/hooks/use-user-settings';
import { formatCurrency } from '@/lib/utils';

const demoOverview = {
  netWorth: 127450.82,
  totalAssets: 132450.82,
  totalLiabilities: 5000,
  monthlyIncome: 12500,
  monthlyExpenses: 7850,
  investments: 89200,
  savings: 38250.82,
  accounts: [
    { id: 'demo-checking', balance: 12500, type: 'checking', name: 'Main Checking', institution: 'Demo Bank' },
    { id: 'demo-savings', balance: 25750.82, type: 'savings', name: 'High Yield Savings', institution: 'Demo Bank' },
  ],
  assetsByType: {
    checking: 12500,
    savings: 25750.82,
    investment: 89200,
  },
  liabilitiesByType: {
    credit: 5000,
  },
};

function DashboardPage() {
  const { overview, loading, error, refetch } = useDashboardData({
    refetchOnFocus: false,
    refetchInterval: 300000,
  });
  const { settings } = useUserSettings(true);
  const useDemo = settings.useDemoData;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const data = overview || (useDemo ? demoOverview : null);
  const netWorth = data?.netWorth ?? null;
  const totalAssets = data?.totalAssets ?? 0;
  const totalLiabilities = data?.totalLiabilities ?? 0;
  const accounts = data?.accounts ?? [];

  // Calculate assets/liabilities by type from accounts
  const assetsByType = (data as typeof demoOverview)?.assetsByType ?? {};
  const liabilitiesByType = (data as typeof demoOverview)?.liabilitiesByType ?? {};

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

  if (error && !useDemo) {
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
      <div className="p-6 lg:p-10 max-w-[1200px] mx-auto">
        {/* Header */}
        <header className="mb-8 animate-in">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">Welcome back</p>
              <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
                Your Finances
              </h1>
            </div>
            <Link
              href="/accounts"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Account</span>
            </Link>
          </div>

          {useDemo && (
            <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Viewing demo data.{' '}
                <Link href="/accounts" className="underline underline-offset-2 font-medium">
                  Connect your accounts
                </Link>{' '}
                to see real numbers.
              </p>
            </div>
          )}
        </header>

        {/* Net Worth Hero - THE MAIN THING */}
        <section className="mb-8 animate-in delay-75">
          <NetWorthHero
            netWorth={netWorth}
            previousNetWorth={null} // TODO: Fetch from history
            lastUpdated={new Date()}
            isLoading={loading}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        </section>

        {/* Net Worth Breakdown */}
        {data && accounts.length > 0 && (
          <section className="mb-8 animate-in delay-150">
            <NetWorthBreakdown
              totalAssets={totalAssets}
              totalLiabilities={totalLiabilities}
              assetsByType={assetsByType}
              liabilitiesByType={liabilitiesByType}
            />
          </section>
        )}

        {/* Connect Bank CTA */}
        <section className="mb-8 animate-in delay-225">
          <ConnectBankCTA
            accountCount={accounts.length}
            onConnect={handleConnectBank}
          />
        </section>

        {/* Connected Accounts */}
        {data && accounts.length > 0 && (
          <section className="mb-8 animate-in delay-300">
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Your Accounts</h3>
                <Link
                  href="/accounts"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {(accounts.slice(0, 4) as Array<{ id: string; name: string; type: string; balance: number }>).map((account, index) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                    style={{ animationDelay: `${(index + 1) * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        account.type === 'checking'
                          ? 'bg-blue-500/10'
                          : account.type === 'savings'
                            ? 'bg-emerald-500/10'
                            : 'bg-violet-500/10'
                      }`}>
                        <Wallet className={`w-5 h-5 ${
                          account.type === 'checking'
                            ? 'text-blue-600 dark:text-blue-400'
                            : account.type === 'savings'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-violet-600 dark:text-violet-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{account.type}</p>
                      </div>
                    </div>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatCurrency(account.balance)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* AI Insights (existing component) */}
        {data && accounts.length > 0 && (
          <section className="animate-in delay-375">
            <ProactiveInsightsCard />
          </section>
        )}
      </div>
    </div>
  );
}

export default memo(DashboardPage);
