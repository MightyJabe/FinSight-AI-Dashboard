import { HelpCircle } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import { Overview } from '@/types/finance';
import { formatPercentage } from '@/utils/format';

interface FinancialHealthScoreProps {
  overview: Overview;
}

/**
 * Displays a comprehensive financial health score based on key metrics
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
    <TooltipProvider>
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          Financial Health Score
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                A comprehensive score that evaluates your overall financial health based on
                emergency fund status, savings rate, and debt-to-income ratio.
              </p>
            </TooltipContent>
          </Tooltip>
        </h2>
        <div className="flex justify-between items-start">
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
              <span className="text-sm flex items-center">
                Emergency Fund
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Your emergency fund status as a percentage of recommended 3-6 months of
                      expenses. Aim for 100% or higher.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="text-sm font-medium">{formatPercentage(emergencyFundStatus)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center">
                Savings Rate
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      The percentage of your income that you save each month. A higher rate
                      indicates better financial health.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="text-sm font-medium">{formatPercentage(savingsRate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center">
                Debt-to-Income
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      The ratio of your monthly debt payments to your monthly income. A lower ratio
                      indicates better financial health.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="text-sm font-medium">{formatPercentage(debtToIncomeRatio)}</span>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
