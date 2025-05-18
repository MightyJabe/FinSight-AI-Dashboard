import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { Overview } from '@/types/finance';

interface NetWorthWidgetProps {
  data: Overview;
}

export function NetWorthWidget({ data }: NetWorthWidgetProps) {
  const { netWorth, netWorthHistory } = data;

  // Calculate trend
  const getTrend = () => {
    if (netWorthHistory.length < 2) return { value: 0, isPositive: true };

    const current = netWorthHistory[netWorthHistory.length - 1].value;
    const previous = netWorthHistory[netWorthHistory.length - 2].value;
    const change = current - previous;
    const percentageChange = (change / Math.abs(previous)) * 100;

    return {
      value: Math.abs(percentageChange),
      isPositive: change >= 0,
    };
  };

  const trend = getTrend();

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Net Worth</h3>
        <div className="flex items-center space-x-1">
          {trend.isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className={`text-sm ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.value.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="text-2xl font-bold">{formatCurrency(netWorth)}</div>
      <p className="text-xs text-muted-foreground mt-1">
        Based on {data.accounts.length} accounts, {data.manualAssets.length} assets, and{' '}
        {data.liabilities.length} liabilities
      </p>
    </div>
  );
}
