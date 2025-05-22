import { Calendar, DollarSign, HelpCircle, TrendingDown } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { formatCurrency, formatPercentage } from '@/utils/format';

interface DebtPayoffTimelineProps {
  liabilities: Array<{
    name: string;
    amount: number;
    interestRate: number;
    minimumPayment: number;
    remainingPayments: number;
    payoffDate: string;
  }>;
  monthlyPayment: number;
  totalDebt: number;
  projectedPayoffDate: string;
}

/**
 * Displays a timeline and details for debt payoff strategy
 */
export function DebtPayoffTimeline({
  liabilities,
  monthlyPayment,
  totalDebt,
  projectedPayoffDate,
}: DebtPayoffTimelineProps) {
  // Calculate total interest to be paid
  const totalInterest = liabilities.reduce((sum, debt) => {
    const totalPayments = debt.minimumPayment * debt.remainingPayments;
    return sum + (totalPayments - debt.amount);
  }, 0);

  // Calculate debt payoff progress
  const totalPaid = liabilities.reduce((sum, debt) => {
    const totalPayments = debt.minimumPayment * debt.remainingPayments;
    return sum + (debt.amount - totalPayments);
  }, 0);
  const payoffProgress = totalDebt > 0 ? (totalPaid / totalDebt) * 100 : 0;

  // Get progress color class based on percentage
  const getProgressColorClass = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-600';
    return 'bg-rose-500';
  };

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Debt Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              Debt Payoff Timeline
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    A comprehensive view of your debt situation, including total debt, monthly
                    payments, and projected payoff dates.
                  </p>
                </TooltipContent>
              </Tooltip>
            </h2>
            <TrendingDown className="h-5 w-5 text-rose-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 flex items-center">
                Total Debt
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The total amount of all your outstanding debts combined.</p>
                  </TooltipContent>
                </Tooltip>
              </p>
              <p className="text-xl font-bold">{formatCurrency(totalDebt)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 flex items-center">
                Monthly Payment
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The total amount you pay towards all debts each month.</p>
                  </TooltipContent>
                </Tooltip>
              </p>
              <p className="text-xl font-bold">{formatCurrency(monthlyPayment)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 flex items-center">
                Total Interest
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The total amount of interest you&apos;ll pay over the life of your debts.</p>
                  </TooltipContent>
                </Tooltip>
              </p>
              <p className="text-xl font-bold">{formatCurrency(totalInterest)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 flex items-center">
                Payoff Progress
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Your overall progress in paying off all debts, calculated as a percentage of
                      total debt paid.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </p>
              <p className="text-xl font-bold">{formatPercentage(payoffProgress)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-4 bg-gray-100 rounded-full mb-6">
            <div
              className={`absolute h-full rounded-full transition-all duration-500 ${getProgressColorClass(
                payoffProgress
              )}`}
              style={{ width: `${Math.min(100, Math.max(0, payoffProgress))}%` }}
            />
          </div>

          {/* Projected Payoff */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-blue-700 flex items-center">
                Projected Payoff Date
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      The estimated date when all your debts will be fully paid off based on current
                      payment schedules.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </span>
            </div>
            <span className="font-medium text-blue-700">{projectedPayoffDate}</span>
          </div>
        </div>

        {/* Debt Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            Debt Details
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Detailed breakdown of each debt, including remaining balance, interest rate, and
                  payment schedule.
                </p>
              </TooltipContent>
            </Tooltip>
          </h3>
          <div className="space-y-4">
            {liabilities.map(debt => {
              const remainingAmount = debt.amount - debt.minimumPayment * debt.remainingPayments;
              const progress =
                debt.amount > 0 ? ((debt.amount - remainingAmount) / debt.amount) * 100 : 0;

              return (
                <div key={debt.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{debt.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(remainingAmount)} remaining at{' '}
                        {formatPercentage(debt.interestRate)} APR
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(debt.minimumPayment)}/mo</p>
                      <p className="text-sm text-gray-500">Due {debt.payoffDate}</p>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className={`h-full rounded-full ${getProgressColorClass(progress)}`}
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress: {formatPercentage(progress)}</span>
                    <span>{debt.remainingPayments} payments remaining</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Strategy */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            Payment Strategy
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Different approaches to paying off your debts, each with its own advantages.</p>
              </TooltipContent>
            </Tooltip>
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Avalanche Method</p>
                <p className="text-sm text-gray-500">
                  Pay off debts with the highest interest rates first to minimize total interest
                  paid
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Snowball Method</p>
                <p className="text-sm text-gray-500">
                  Pay off smallest debts first to build momentum and motivation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium">Consolidation</p>
                <p className="text-sm text-gray-500">
                  Consider consolidating high-interest debts into a single lower-interest loan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
