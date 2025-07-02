'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AIInsights } from '@/components/dashboard/AIInsights';
import { BudgetSection } from '@/components/dashboard/BudgetSection';
import { ChartsSection } from '@/components/dashboard/ChartsSection';
import { FinancialHealthScore } from '@/components/dashboard/FinancialHealthScore';
import { NetWorthDisplay } from '@/components/dashboard/NetWorthDisplay';
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
  return (
    <div className="space-y-6">
      {/* Net Worth Display */}
      <NetWorthDisplay netWorth={overview.netWorth} />

      {/* Financial Health Score */}
      <FinancialHealthScore overview={overview} />

      {/* Charts Section */}
      <ChartsSection overview={overview} />

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
