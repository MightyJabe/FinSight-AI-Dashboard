import type { Overview } from '@/types/finance';
import { formatCurrency } from '@/utils/format';

interface NetWorthWidgetProps {
  data: Overview;
}

/**
 * Displays net worth information in a widget format
 */
export function NetWorthWidget({ data }: NetWorthWidgetProps) {
  const { netWorth } = data;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Net Worth</h3>
      </div>
      <div className="text-2xl font-bold">{formatCurrency(netWorth)}</div>
      <p className="text-xs text-muted-foreground mt-1">
        Based on {data.accounts.length} accounts, {data.manualAssets.length} assets, and{' '}
        {data.liabilities.length} liabilities
      </p>
    </div>
  );
}
