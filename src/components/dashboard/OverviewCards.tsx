import { motion } from 'framer-motion';
import { AlertCircle, HelpCircle, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { Overview } from '@/lib/finance';
import { formatCurrency } from '@/utils/format';

interface OverviewCardsProps {
  overview: Overview;
}

/**
 * Displays key financial metrics in card format with tooltips
 */
export function OverviewCards({ overview }: OverviewCardsProps) {
  const { monthlyIncome, monthlyExpenses, emergencyFundStatus, savingsRate } = overview;

  const savingsRatePercentage = (savingsRate * 100).toFixed(1);
  const emergencyFundPercentage = (emergencyFundStatus * 100).toFixed(1);

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, type: 'spring', stiffness: 80 },
    }),
  };

  return (
    <TooltipProvider>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Monthly Income',
            value: formatCurrency(monthlyIncome),
            icon: <TrendingUp className="h-6 w-6 text-green-500" />,
            iconBg: 'bg-green-500/10',
            badge: (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                + Income
              </span>
            ),
            tooltip:
              'Your total monthly income from all sources, including salary, investments, and other earnings.',
          },
          {
            label: 'Monthly Expenses',
            value: formatCurrency(monthlyExpenses),
            icon: <TrendingDown className="h-6 w-6 text-rose-500" />,
            iconBg: 'bg-rose-500/10',
            badge: (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs">
                - Expense
              </span>
            ),
            tooltip:
              'Your total monthly expenses across all categories, including bills, groceries, and discretionary spending.',
          },
          {
            label: 'Savings Rate',
            value: `${savingsRatePercentage}%`,
            icon: <PiggyBank className="h-6 w-6 text-blue-500" />,
            iconBg: 'bg-blue-500/10',
            badge: (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                {savingsRatePercentage}%
              </span>
            ),
            tooltip:
              'The percentage of your income that you save each month. A higher rate indicates better financial health.',
          },
          {
            label: 'Emergency Fund',
            value: `${emergencyFundPercentage}%`,
            icon: <AlertCircle className="h-6 w-6 text-amber-500" />,
            iconBg: 'bg-amber-500/10',
            badge: (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs">
                {emergencyFundPercentage}%
              </span>
            ),
            tooltip:
              'Your emergency fund status as a percentage of recommended 3-6 months of expenses. Aim for 100% or higher.',
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            className="rounded-xl border bg-card/80 backdrop-blur p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 group focus-within:ring-2 focus-within:ring-primary"
            initial="hidden"
            animate="visible"
            custom={i}
            variants={cardVariants}
            tabIndex={0}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground flex items-center">
                {card.label}
                {card.badge}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{card.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </span>
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center ${card.iconBg} group-hover:scale-105 transition-transform`}
              >
                {card.icon}
              </div>
            </div>
            <h3 className="text-3xl font-extrabold tracking-tight text-foreground mt-2">
              {card.value}
            </h3>
          </motion.div>
        ))}
      </div>
    </TooltipProvider>
  );
}
