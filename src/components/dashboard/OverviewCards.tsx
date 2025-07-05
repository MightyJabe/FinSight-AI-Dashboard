import { motion } from 'framer-motion';
import { AlertCircle, ArrowUpRight, BarChart3, HelpCircle, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { Overview } from '@/lib/finance';
import { formatCurrency } from '@/utils/format';

interface OverviewCardsProps {
  overview: Overview;
  onCardClick?: (cardType: string) => void;
}

/**
 * Displays key financial metrics in card format with tooltips
 */
export function OverviewCards({ overview, onCardClick }: OverviewCardsProps) {
  const { monthlyIncome, monthlyExpenses, emergencyFundStatus, savingsRate } = overview;
  
  const netFlow = monthlyIncome - monthlyExpenses;
  const expenseRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;

  const savingsRatePercentage = (savingsRate * 100).toFixed(1);
  const emergencyFundPercentage = (emergencyFundStatus * 100).toFixed(1);

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, type: 'spring' as const, stiffness: 80 },
    }),
  };

  return (
    <TooltipProvider>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[
          {
            id: 'income',
            label: 'Monthly Income',
            value: formatCurrency(monthlyIncome),
            icon: <TrendingUp className="h-6 w-6 text-green-500" />,
            iconBg: 'bg-green-500/10',
            badge: (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                + Income
              </span>
            ),
            tooltip:
              'Your total monthly income from all sources, including salary, investments, and other earnings.',
            trend: monthlyIncome > 0 ? '+' : '',
            clickable: true,
          },
          {
            id: 'expenses',
            label: 'Monthly Expenses',
            value: formatCurrency(monthlyExpenses),
            icon: <TrendingDown className="h-6 w-6 text-rose-500" />,
            iconBg: 'bg-rose-500/10',
            badge: (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-medium">
                {expenseRatio.toFixed(1)}% of income
              </span>
            ),
            tooltip:
              'Your total monthly expenses across all categories, including bills, groceries, and discretionary spending.',
            trend: expenseRatio > 70 ? 'high' : expenseRatio > 50 ? 'medium' : 'low',
            clickable: true,
          },
          {
            id: 'savings',
            label: 'Savings Rate',
            value: `${savingsRatePercentage}%`,
            icon: <PiggyBank className="h-6 w-6 text-blue-500" />,
            iconBg: 'bg-blue-500/10',
            badge: (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                savingsRate >= 0.2 ? 'bg-green-100 text-green-700' :
                savingsRate >= 0.1 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {savingsRate >= 0.2 ? 'Excellent' : savingsRate >= 0.1 ? 'Good' : 'Needs Work'}
              </span>
            ),
            tooltip:
              'The percentage of your income that you save each month. Aim for 20% or higher for excellent financial health.',
            trend: savingsRate >= 0.2 ? 'excellent' : savingsRate >= 0.1 ? 'good' : 'poor',
            clickable: true,
          },
          {
            id: 'emergency',
            label: 'Emergency Fund',
            value: `${emergencyFundPercentage}%`,
            icon: <AlertCircle className="h-6 w-6 text-amber-500" />,
            iconBg: 'bg-amber-500/10',
            badge: (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                emergencyFundStatus >= 1 ? 'bg-green-100 text-green-700' :
                emergencyFundStatus >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {emergencyFundStatus >= 1 ? 'Secure' : emergencyFundStatus >= 0.5 ? 'Building' : 'Critical'}
              </span>
            ),
            tooltip:
              'Your emergency fund status as a percentage of recommended 3-6 months of expenses. Aim for 100% or higher.',
            trend: emergencyFundStatus >= 1 ? 'secure' : emergencyFundStatus >= 0.5 ? 'building' : 'critical',
            clickable: true,
          },
          {
            id: 'netflow',
            label: 'Net Cash Flow',
            value: formatCurrency(netFlow),
            icon: <BarChart3 className={`h-6 w-6 ${netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`} />,
            iconBg: `${netFlow >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`,
            badge: (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                netFlow >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {netFlow >= 0 ? 'Positive' : 'Negative'}
              </span>
            ),
            tooltip:
              'Your monthly income minus expenses. Positive cash flow means you\'re living within your means.',
            trend: netFlow >= 0 ? 'positive' : 'negative',
            clickable: true,
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            className={`rounded-xl border bg-card/80 backdrop-blur p-6 shadow-lg hover:shadow-xl transition-all duration-200 group focus-within:ring-2 focus-within:ring-primary ${
              card.clickable ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
            }`}
            initial="hidden"
            animate="visible"
            custom={i}
            variants={cardVariants}
            tabIndex={0}
            onClick={() => card.clickable && onCardClick?.(card.id)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && card.clickable) {
                e.preventDefault();
                onCardClick?.(card.id);
              }
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </span>
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
              <div className="flex items-center justify-between">
                {card.badge}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </TooltipProvider>
  );
}
