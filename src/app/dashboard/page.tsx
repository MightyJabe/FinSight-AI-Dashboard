'use client';

import { ArrowRight, CreditCard, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';

import { NetWorthCard } from '@/components/dashboard/NetWorthCard';
import { ProactiveInsightsCard } from '@/components/dashboard/ProactiveInsightsCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DashboardSkeleton,
  EmptyState,
} from '@/components/ui';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { formatCurrency } from '@/lib/utils';

function DashboardPage() {
  const { overview, loading, error } = useDashboardData({
    refetchOnFocus: false,
    refetchInterval: 300000,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
        <Card variant="elevated" className="max-w-md mx-auto mt-20">
          <CardContent className="py-8">
            <EmptyState
              icon={<CreditCard className="w-8 h-8" />}
              title="Unable to load dashboard"
              description={error}
              action={{
                label: 'Retry',
                onClick: () => window.location.reload(),
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Your financial overview at a glance</p>
      </div>

      <div className="space-y-6">
        {/* Net Worth Hero Card */}
        {overview && (
          <NetWorthCard
            netWorth={overview.netWorth}
            change={overview.netWorth * 0.052}
            changePercent={5.2}
          />
        )}

        {/* Quick Actions */}
        <QuickActions />

        {/* 3-Column Grid: Cash Flow, Investments, Goals */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Cash Flow Card */}
          <Card variant="elevated" hover>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Cash Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Monthly Income</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(overview?.monthlyIncome || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(overview?.monthlyExpenses || 0)}
                  </p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">Net Savings</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(
                      (overview?.monthlyIncome || 0) - (overview?.monthlyExpenses || 0)
                    )}
                  </p>
                </div>
              </div>
              <Link href="/trends" className="mt-4 block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  View Trends
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Investments Card */}
          <Card variant="elevated" hover>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Investments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Performance</p>
                  <p className="text-lg font-semibold text-green-600">+8.2%</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500">Last 30 days</p>
                </div>
              </div>
              <Link href="/investments" className="mt-4 block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  View Portfolio
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Goals Card */}
          <Card variant="elevated" hover>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-purple-600" />
                Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Active Goals</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Target</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(50000)}</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500">On track to complete</p>
                </div>
              </div>
              <Link href="/goals" className="mt-4 block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  View Goals
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <ProactiveInsightsCard />

        {/* Recent Activity */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Link href="/transactions">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {overview?.accounts && overview.accounts.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Connect to Plaid or add manual transactions to see your recent activity here.
                </p>
                <Link href="/transactions">
                  <Button
                    variant="outline"
                    className="w-full"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Go to Transactions
                  </Button>
                </Link>
              </div>
            ) : (
              <EmptyState
                icon={<CreditCard className="w-8 h-8" />}
                title="No accounts connected yet"
                description="Connect your first account to start tracking your finances"
                action={{
                  label: 'Connect Account',
                  onClick: () => (window.location.href = '/accounts'),
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default memo(DashboardPage);
