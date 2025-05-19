import { TrendingUp } from 'lucide-react';

import { formatCurrency } from '@/utils/format';

interface NetWorthDisplayProps {
  netWorth: number;
  className?: string;
}

/**
 *
 */
export function NetWorthDisplay({ netWorth, className = '' }: NetWorthDisplayProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <TrendingUp className="h-6 w-6 text-green-500" />
      <div>
        <div className="text-xs text-gray-500">Net Worth</div>
        <div className="text-lg font-bold text-gray-900">{formatCurrency(netWorth)}</div>
      </div>
    </div>
  );
}
