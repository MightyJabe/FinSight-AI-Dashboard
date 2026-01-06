'use client';

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CreditCard,
  PiggyBank,
  Plus,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';

import { DashboardSkeleton } from '@/components/ui';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useUserSettings } from '@/hooks/use-user-settings';
import { formatCurrency } from '@/lib/utils';

const demoOverview = {
  netWorth: 127450.82,
  monthlyIncome: 12500,
  monthlyExpenses: 7850,
  investments: 89200,
  savings: 38250.82,
  accounts: [
    { id: 'demo-checking', balance: 12500, type: 'checking', name: 'Main Checking' },
    { id: 'demo-savings', balance: 25750.82, type: 'savings', name: 'High Yield Savings' },
  ],
};

function DashboardPage() {
  const { overview, loading, error } = useDashboardData({
    refetchOnFocus: false,
    refetchInterval: 300000,
  });
  const { settings } = useUserSettings(true);
  const useDemo = settings.useDemoData;

  const data = overview || (useDemo ? demoOverview : null);
  const netWorth = data?.netWorth ?? 0;
  const monthlyIncome = data?.monthlyIncome ?? 0;
  const monthlyExpenses = data?.monthlyExpenses ?? 0;
  const netSavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (netSavings / monthlyIncome) * 100 : 0;

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
      {/* Main Content */}
      <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="mb-10 animate-in">
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

        {/* Net Worth Hero */}
        <section className="mb-10 animate-in delay-75">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-900 dark:to-black p-8 lg:p-12">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
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
                    {formatCurrency(netWorth)}
                  </h2>
                  <div className="flex items-center gap-3 mt-4">
                    <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                      <ArrowUpRight className="w-4 h-4" />
                      +5.2%
                    </span>
                    <span className="text-neutral-500 text-sm">vs last month</span>
                  </div>
                </div>

                {/* Mini Chart Placeholder */}
                <div className="flex items-end gap-1 h-20 opacity-60">
                  {[40, 55, 45, 60, 52, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
                    <div
                      key={i}
                      className="w-3 lg:w-4 bg-gradient-to-t from-emerald-500/50 to-emerald-400 rounded-t"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
          {/* Monthly Income */}
          <div className="animate-in delay-150 p-6 rounded-2xl bg-card border border-border card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                Income
              </span>
            </div>
            <p className="metric-label mb-1">Monthly Income</p>
            <p className="text-2xl lg:text-3xl font-semibold tabular-nums">
              {formatCurrency(monthlyIncome)}
            </p>
          </div>

          {/* Monthly Expenses */}
          <div className="animate-in delay-225 p-6 rounded-2xl bg-card border border-border card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full">
                Expenses
              </span>
            </div>
            <p className="metric-label mb-1">Monthly Expenses</p>
            <p className="text-2xl lg:text-3xl font-semibold tabular-nums">
              {formatCurrency(monthlyExpenses)}
            </p>
          </div>

          {/* Net Savings */}
          <div className="animate-in delay-300 p-6 rounded-2xl bg-card border border-border card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                netSavings >= 0
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
              }`}>
                {netSavings >= 0 ? '+' : ''}{savingsRate.toFixed(0)}% rate
              </span>
            </div>
            <p className="metric-label mb-1">Net Savings</p>
            <p className={`text-2xl lg:text-3xl font-semibold tabular-nums ${
              netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {netSavings >= 0 ? '+' : ''}{formatCurrency(netSavings)}
            </p>
          </div>

          {/* Investments */}
          <div className="animate-in delay-375 p-6 rounded-2xl bg-card border border-border card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                +8.2%
              </span>
            </div>
            <p className="metric-label mb-1">Investments</p>
            <p className="text-2xl lg:text-3xl font-semibold tabular-nums">
              {formatCurrency(demoOverview.investments)}
            </p>
          </div>
        </section>

        {/* Bottom Section: Accounts + Quick Actions */}
        <section className="grid lg:grid-cols-3 gap-6">
          {/* Accounts List */}
          <div className="lg:col-span-2 animate-in p-6 rounded-2xl bg-card border border-border">
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

            {data?.accounts && data.accounts.length > 0 ? (
              <div className="space-y-3">
                {(data.accounts.slice(0, 4) as Array<{id: string; name: string; type: string; balance: number}>).map((account, index) => (
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
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="font-medium mb-2">No accounts connected</h4>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  Connect your bank accounts to see your complete financial picture
                </p>
                <Link
                  href="/accounts"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  Connect Account
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="animate-in p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/transactions"
                className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">View Transactions</p>
                  <p className="text-sm text-muted-foreground">See recent activity</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/accounts"
                className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Link Account</p>
                  <p className="text-sm text-muted-foreground">Connect new bank</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/settings"
                className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Upgrade to Pro</p>
                  <p className="text-sm text-muted-foreground">Unlock all features</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default memo(DashboardPage);
