'use client';

import { BudgetSection } from '@/components/dashboard/BudgetSection';
import { ChartsSection } from '@/components/dashboard/ChartsSection';
import { DebtPayoffTimeline } from '@/components/dashboard/DebtPayoffTimeline';
import { FinancialHealthScore } from '@/components/dashboard/FinancialHealthScore';
import { InvestmentPerformance } from '@/components/dashboard/InvestmentPerformance';
import { OverviewCards } from '@/components/dashboard/OverviewCards';
import type { Budget, InvestmentAccounts, Liabilities, Overview } from '@/lib/finance';

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
    <div className="space-y-8 p-8">
      <OverviewCards overview={overview} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FinancialHealthScore overview={overview} />
        <ChartsSection overview={overview} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <InvestmentPerformance
          investmentAccounts={investmentAccounts.accounts}
          assetAllocation={investmentAccounts.assetAllocation}
          historicalPerformance={investmentAccounts.historicalPerformance}
        />
        <DebtPayoffTimeline
          liabilities={liabilities.accounts}
          monthlyPayment={liabilities.totalMonthlyPayment}
          totalDebt={liabilities.totalDebt}
          projectedPayoffDate={liabilities.projectedPayoffDate}
        />
      </div>
      <BudgetSection budget={budget} />
    </div>
  );
}
