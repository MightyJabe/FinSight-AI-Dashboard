import { TrendingUp, Wallet } from 'lucide-react';

import { Overview } from '@/lib/finance';
import { formatCurrency } from '@/utils/format';

interface BalanceOverviewProps {
  overview: Overview;
}

/**
 * Displays the user's total available cash and net worth
 */
export function BalanceOverview({ overview }: BalanceOverviewProps) {
  const { netWorth, totalCashAssets, manualAssets } = overview;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Total Available Cash Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Total Available Cash</h2>
          <Wallet className="h-5 w-5 text-blue-600" />
        </div>
        <div className="space-y-2">
          <p className="text-3xl font-bold">{formatCurrency(totalCashAssets)}</p>
          <p className="text-sm text-gray-500">
            Sum of cash, bank accounts, and other liquid assets.
          </p>
          {/* Optional: Add a breakdown of sources if needed in the future */}
        </div>
      </div>

      {/* Net Worth Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Net Worth</h2>
          <TrendingUp className="h-5 w-5 text-green-500" />
        </div>
        <div className="space-y-2">
          <p className="text-3xl font-bold">{formatCurrency(netWorth)}</p>
          <p className="text-sm text-gray-500">
            Including {manualAssets.length} assets and {overview.liabilities.length} liabilities
          </p>
        </div>
      </div>
    </div>
  );
}
