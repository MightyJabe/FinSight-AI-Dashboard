import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  HelpCircle,
  PiggyBank,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { memo, useMemo } from 'react';

import { Card, CardGroup, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import { Overview } from '@/types/finance';
import { formatCurrency } from '@/utils/format';

interface OverviewCardsProps {
  overview: Overview;
  onCardClick?: (cardType: string) => void;
}

/**
 * Displays key financial metrics in card format with tooltips
 */
export const OverviewCards = memo(function OverviewCards({
  overview,
  onCardClick,
}: OverviewCardsProps) {
  const { monthlyIncome, monthlyExpenses, emergencyFundStatus, savingsRate } = overview;

  // Memoize expensive calculations
  const cards = useMemo(() => {
    const netFlow = monthlyIncome - monthlyExpenses;
    const expenseRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;
    const savingsRatePercentage = (savingsRate * 100).toFixed(1);
    const emergencyFundPercentage = (emergencyFundStatus * 100).toFixed(1);

    return [
      {
        id: 'income',
        label: 'Monthly Income',
        value: formatCurrency(monthlyIncome),
        icon: <TrendingUp className="h-6 w-6 text-green-500" />,
        iconBg: 'bg-green-500/10',
        badge: (
          <span className="ml-2 px-2 py-0.5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-medium shadow-sm">
            + Income
          </span>
        ),
        tooltip:
          'Your total monthly income from all sources, including salary, investments, and other earnings.',
        clickable: true,
      },
      {
        id: 'expenses',
        label: 'Monthly Expenses',
        value: formatCurrency(monthlyExpenses),
        icon: <TrendingDown className="h-6 w-6 text-rose-500" />,
        iconBg: 'bg-rose-500/10',
        badge: (
          <span className="ml-2 px-2 py-0.5 rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs font-medium shadow-sm">
            {expenseRatio.toFixed(1)}% of income
          </span>
        ),
        tooltip:
          'Your total monthly expenses across all categories, including bills, groceries, and discretionary spending.',
        clickable: true,
      },
      {
        id: 'savings',
        label: 'Savings Rate',
        value: `${savingsRatePercentage}%`,
        icon: <PiggyBank className="h-6 w-6 text-blue-500" />,
        iconBg: 'bg-blue-500/10',
        badge: (
          <span
            className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium shadow-sm text-white ${
              savingsRate >= 0.2
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                : savingsRate >= 0.1
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                  : 'bg-gradient-to-br from-red-500 to-rose-600'
            }`}
          >
            {savingsRate >= 0.2 ? 'Excellent' : savingsRate >= 0.1 ? 'Good' : 'Needs Work'}
          </span>
        ),
        tooltip:
          'The percentage of your income that you save each month. Aim for 20% or higher for excellent financial health.',
        clickable: true,
      },
      {
        id: 'emergency',
        label: 'Emergency Fund',
        value: `${emergencyFundPercentage}%`,
        icon: <AlertCircle className="h-6 w-6 text-amber-500" />,
        iconBg: 'bg-amber-500/10',
        badge: (
          <span
            className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium shadow-sm text-white ${
              emergencyFundStatus >= 1
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                : emergencyFundStatus >= 0.5
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                  : 'bg-gradient-to-br from-red-500 to-rose-600'
            }`}
          >
            {emergencyFundStatus >= 1
              ? 'Secure'
              : emergencyFundStatus >= 0.5
                ? 'Building'
                : 'Critical'}
          </span>
        ),
        tooltip:
          'Your emergency fund status as a percentage of recommended 3-6 months of expenses. Aim for 100% or higher.',
        clickable: true,
      },
      {
        id: 'netflow',
        label: 'Net Cash Flow',
        value: formatCurrency(netFlow),
        icon: (
          <BarChart3 className={`h-6 w-6 ${netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`} />
        ),
        iconBg: `${netFlow >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`,
        badge: (
          <span
            className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium shadow-sm text-white ${
              netFlow >= 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-red-500 to-rose-600'
            }`}
          >
            {netFlow >= 0 ? 'Positive' : 'Negative'}
          </span>
        ),
        tooltip:
          "Your monthly income minus expenses. Positive cash flow means you're living within your means.",
        clickable: true,
      },
    ];
  }, [monthlyIncome, monthlyExpenses, emergencyFundStatus, savingsRate]);

  return (
    <TooltipProvider>
      <CardGroup className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" stagger={0.08}>
        {cards.map(card => (
          <Card
            key={card.label}
            variant="elevated"
            padding="md"
            interactive={card.clickable}
            animate
            depth
            className="group focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            tabIndex={0}
            onClick={() => card.clickable && onCardClick?.(card.id)}
            onKeyDown={e => {
              if ((e.key === 'Enter' || e.key === ' ') && card.clickable) {
                e.preventDefault();
                onCardClick?.(card.id);
              }
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{card.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
                {card.clickable && (
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground/80 transition-colors" />
                )}
              </div>
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center ${card.iconBg} group-hover:scale-105 transition-transform`}
              >
                {card.icon}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-extrabold tracking-tight text-foreground">
                {card.value}
              </h3>
              <div className="flex items-center justify-between">{card.badge}</div>
            </div>
          </Card>
        ))}
      </CardGroup>
    </TooltipProvider>
  );
});
