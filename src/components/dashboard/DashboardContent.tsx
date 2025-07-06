'use client';

import dynamic from 'next/dynamic';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useState } from 'react';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AIInsights } from '@/components/dashboard/AIInsights';
import { BudgetRecommendations } from '@/components/dashboard/BudgetRecommendations';
import { BudgetSection } from '@/components/dashboard/BudgetSection';
import { CashFlowForecast } from '@/components/dashboard/CashFlowForecast';
import { ChartsSection } from '@/components/dashboard/ChartsSection';
import { FinancialHealthScore } from '@/components/dashboard/FinancialHealthScore';
import { InvestmentAdvisor } from '@/components/dashboard/InvestmentAdvisor';
import { NetWorthDisplay } from '@/components/dashboard/NetWorthDisplay';
import { OverviewCards } from '@/components/dashboard/OverviewCards';
import type { Budget, InvestmentAccounts, Liabilities, Overview } from '@/types/finance';

// Dynamic imports for heavy components that are conditionally rendered
const DebtPayoffTimeline = dynamic(
  () =>
    import('@/components/dashboard/DebtPayoffTimeline').then(mod => ({
      default: mod.DebtPayoffTimeline,
    })),
  {
    loading: () => <LoadingSpinner message="Loading debt timeline..." />,
    ssr: false, // Disable SSR for chart components
  }
);

const InvestmentPerformance = dynamic(
  () =>
    import('@/components/dashboard/InvestmentPerformance').then(mod => ({
      default: mod.InvestmentPerformance,
    })),
  {
    loading: () => <LoadingSpinner message="Loading investment data..." />,
    ssr: false, // Disable SSR for chart components
  }
);

interface DashboardContentProps {
  overview: Overview;
  budget: Budget;
  investmentAccounts: InvestmentAccounts;
  liabilities: Liabilities;
}

/**
 *
 */
export function DashboardContent({
  overview,
  budget,
  investmentAccounts,
  liabilities,
}: DashboardContentProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);

  const handleCardClick = (cardType: string) => {
    setSelectedMetric(selectedMetric === cardType ? null : cardType);
    // Add analytics tracking or navigation logic here
    console.log(`Clicked on ${cardType} metric for drill-down`);
  };

  return (
    <div className="space-y-6">
      {/* Net Worth Display */}
      <NetWorthDisplay netWorth={overview.netWorth} />

      {/* Enhanced Overview Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Financial Overview</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Real-time updates:</span>
            <button
              onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isRealTimeEnabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isRealTimeEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        <OverviewCards overview={overview} onCardClick={handleCardClick} />
        {selectedMetric && (
          <div className="rounded-lg border bg-card/50 p-4">
            <h3 className="text-lg font-semibold mb-2">Detailed View: {selectedMetric}</h3>
            <p className="text-sm text-muted-foreground">
              Drill-down analytics for {selectedMetric} would appear here. This could include historical trends, 
              comparisons, and actionable insights.
            </p>
          </div>
        )}
      </div>

      {/* AI Chat Link */}
      <Link href="/chat">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 rounded-xl p-6 border border-primary/20 hover:border-primary/30 transition-all duration-200 cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 group-hover:bg-primary/20 rounded-lg transition-colors">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Ask Your AI Financial Assistant</h3>
              <p className="text-gray-600 text-sm">
                Get instant answers about your finances with visual analytics and conversation history
              </p>
            </div>
            <div className="text-primary group-hover:translate-x-1 transition-transform">
              →
            </div>
          </div>
        </div>
      </Link>

      {/* Financial Health Score */}
      <FinancialHealthScore overview={overview} />

      {/* Charts Section */}
      <ChartsSection overview={overview} />

      {/* Budget Recommendations */}
      <BudgetRecommendations />

      {/* Cash Flow Forecast */}
      <CashFlowForecast />

      {/* Investment Advisor */}
      <InvestmentAdvisor />

      {/* AI Insights */}
      <AIInsights insights={[]} insightsLoading={false} />

      {/* Debt Payoff Timeline - Dynamically loaded */}
      {liabilities.accounts.length > 0 && (
        <Suspense fallback={<LoadingSpinner message="Loading debt timeline..." />}>
          <DebtPayoffTimeline
            liabilities={liabilities.accounts}
            totalDebt={liabilities.totalDebt}
          />
        </Suspense>
      )}

      {/* Investment Performance - Dynamically loaded */}
      {investmentAccounts.accounts.length > 0 && (
        <Suspense fallback={<LoadingSpinner message="Loading investment data..." />}>
          <InvestmentPerformance investmentAccounts={investmentAccounts.accounts} />
        </Suspense>
      )}

      {/* Budget Section */}
      {budget.budgetCategories.length > 0 && (
        <BudgetSection budgetCategories={budget.budgetCategories} />
      )}
    </div>
  );
}
