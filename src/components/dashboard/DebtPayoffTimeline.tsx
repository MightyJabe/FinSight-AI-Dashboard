import { Calendar } from 'lucide-react';

import { formatCurrency, formatPercentage } from '@/utils/format';

interface DebtPayoffTimelineProps {
  liabilities: Array<{
    id: string;
    name: string;
    amount: number;
    type: string;
    interestRate: number;
    minimumPayment: number;
    remainingPayments: number;
    payoffDate: string;
  }>;
  totalDebt: number;
}

/**
 * Displays debt payoff timeline and strategies
 */
export function DebtPayoffTimeline({ liabilities, totalDebt }: DebtPayoffTimelineProps) {
  // Calculate total monthly payment from individual liabilities
  const totalMonthlyPayment = liabilities.reduce(
    (sum, liability) => sum + liability.minimumPayment,
    0
  );

  // Calculate projected payoff date (simplified - could be enhanced later)
  const projectedPayoffDate =
    liabilities.length > 0
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 year from now as placeholder
      : '';

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Debt Payoff Timeline
        </h3>
      </div>

      <div className="p-6">
        {/* Debt Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Total Debt</p>
            <p className="text-xl font-bold text-rose-600">{formatCurrency(totalDebt)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Monthly Payment</p>
            <p className="text-xl font-bold">{formatCurrency(totalMonthlyPayment)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Projected Payoff</p>
            <p className="text-xl font-bold">{projectedPayoffDate || 'Not calculated'}</p>
          </div>
        </div>

        {/* Liabilities List */}
        <div>
          <h4 className="text-md font-medium mb-4">Debt Breakdown</h4>
          <div className="space-y-3">
            {liabilities.map(liability => (
              <div
                key={liability.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h5 className="font-medium">{liability.name}</h5>
                  <p className="text-sm text-gray-500">{liability.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(liability.amount)}</p>
                  <p className="text-sm text-gray-500">
                    {formatPercentage(liability.interestRate)} APR
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payoff Strategy */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-md font-medium mb-2">Payoff Strategy</h4>
          <p className="text-sm text-gray-600">
            Focus on high-interest debt first (avalanche method) or smallest balances first
            (snowball method) to accelerate your debt-free journey.
          </p>
        </div>
      </div>
    </div>
  );
}
