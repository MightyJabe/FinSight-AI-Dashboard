import { Calendar, DollarSign, TrendingDown } from 'lucide-react';

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
  const payoffProgress = (totalPaid / totalDebt) * 100;

  // Get progress color class based on percentage
  const getProgressColorClass = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-600';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-8">
      {/* Debt Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Debt Payoff Timeline</h2>
          <TrendingDown className="h-5 w-5 text-rose-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Total Debt</p>
            <p className="text-xl font-bold">{formatCurrency(totalDebt)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Monthly Payment</p>
            <p className="text-xl font-bold">{formatCurrency(monthlyPayment)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Total Interest</p>
            <p className="text-xl font-bold">{formatCurrency(totalInterest)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Payoff Progress</p>
            <p className="text-xl font-bold">{formatPercentage(payoffProgress)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-4 bg-gray-100 rounded-full mb-6">
          <div
            className={`absolute h-full rounded-full transition-all duration-500 ${getProgressColorClass(
              payoffProgress
            )}`}
            style={{ width: `${payoffProgress}%` }}
          />
        </div>

        {/* Projected Payoff */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="text-blue-700">Projected Payoff Date</span>
          </div>
          <span className="font-medium text-blue-700">{projectedPayoffDate}</span>
        </div>
      </div>

      {/* Debt Details */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Debt Details</h3>
        <div className="space-y-4">
          {liabilities.map(debt => {
            const remainingAmount = debt.amount - debt.minimumPayment * debt.remainingPayments;
            const progress = ((debt.amount - remainingAmount) / debt.amount) * 100;

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
                    style={{ width: `${progress}%` }}
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
        <h3 className="text-lg font-semibold mb-4">Payment Strategy</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <DollarSign className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium">Avalanche Method</p>
              <p className="text-sm text-gray-500">
                Pay off debts with the highest interest rates first to minimize total interest paid
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
  );
}
