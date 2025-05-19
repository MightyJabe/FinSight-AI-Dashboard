import { Overview } from '@/lib/finance';
import { formatPercentage } from '@/utils/format';

interface FinancialHealthScoreProps {
  overview: Overview;
}

/**
 *
 */
export function FinancialHealthScore({ overview }: FinancialHealthScoreProps) {
  const { emergencyFundStatus = 0, savingsRate = 0, debtToIncomeRatio = 0 } = overview;

  const healthScore = Math.max(
    0,
    emergencyFundStatus * 0.3 + savingsRate * 0.3 + (100 - debtToIncomeRatio) * 0.4
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold mb-4">Financial Health Score</h2>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-4xl font-bold mb-2">
            <span className={getScoreColor(healthScore)}>{Math.round(healthScore)}</span>
            <span className="text-2xl text-muted-foreground">/100</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {getScoreLabel(healthScore)} financial health
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Emergency Fund</span>
            <span className="text-sm font-medium">{formatPercentage(emergencyFundStatus)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Savings Rate</span>
            <span className="text-sm font-medium">{formatPercentage(savingsRate)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Debt-to-Income</span>
            <span className="text-sm font-medium">{formatPercentage(debtToIncomeRatio)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
