import { HelpCircle } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatPercentage } from '@/utils/format';

// Define a more specific prop type
interface BudgetCategory {
  id: string;
  name: string;
  amount: number;
  spent: number;
}

interface BudgetSectionProps {
  // Expect only the budgetCategories array
  budgetCategories: BudgetCategory[];
}

/**
 * Displays budget categories and their spending progress
 */
export function BudgetSection({ budgetCategories = [] }: BudgetSectionProps) {
  // No need to destructure from 'overview' anymore
  const topSpendingCategories = [...budgetCategories].sort((a, b) => b.spent - a.spent).slice(0, 5);

  return (
    <TooltipProvider>
      <div
        className="bg-card/80 backdrop-blur rounded-xl shadow-lg p-6 border border-border/40 hover:shadow-xl transition-shadow duration-200"
        tabIndex={0}
      >
        <h2 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
          Budget Overview
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                A breakdown of your spending across different budget categories, showing progress
                towards monthly limits.
              </p>
            </TooltipContent>
          </Tooltip>
          <span className="text-xs text-muted-foreground font-normal">
            (top spending categories)
          </span>
        </h2>
        <div className="space-y-6">
          {topSpendingCategories.length === 0 ? (
            <div className="text-muted-foreground text-sm">No budget categories found.</div>
          ) : (
            topSpendingCategories.map(category => {
              const utilization = (category.spent / category.amount) * 100;
              let barColor = 'bg-green-500';
              if (utilization >= 100) barColor = 'bg-rose-500';
              else if (utilization >= 75) barColor = 'bg-amber-500';
              return (
                <div key={category.id} className="space-y-2 group" tabIndex={0}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground flex items-center">
                      {category.name}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Monthly budget: {formatCurrency(category.amount)}</p>
                          <p>Spent so far: {formatCurrency(category.spent)}</p>
                          <p>Utilization: {utilization.toFixed(1)}%</p>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(category.spent)} / {formatCurrency(category.amount)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(100, utilization)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatPercentage(utilization)} utilized</span>
                    <span>
                      {category.spent >= category.amount ? (
                        <span className="text-rose-600 font-semibold">Over budget</span>
                      ) : category.spent >= category.amount * 0.75 ? (
                        <span className="text-amber-600 font-semibold">Near limit</span>
                      ) : (
                        <span className="text-green-600 font-semibold">On track</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
