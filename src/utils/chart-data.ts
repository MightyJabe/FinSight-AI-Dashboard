// Utility for generating pie chart data for Chart.js

import { Transaction } from '@/types/finance';

interface ChartDataPoint {
  date: string;
  value: number;
}

/**
 *
 */
export function getPieChartData<T extends Record<string, unknown>>(
  items: T[],
  labelKey: keyof T,
  valueKey: keyof T,
  colorPalette: string[]
) {
  // Group by label
  const grouped: Record<string, number> = {};
  for (const item of items) {
    const label = item[labelKey];
    if (!label) continue;
    const labelStr =
      typeof label === 'string' ? label.charAt(0).toUpperCase() + label.slice(1) : String(label);
    grouped[labelStr] = (grouped[labelStr] || 0) + (item[valueKey] as number);
  }
  return {
    labels: Object.keys(grouped),
    datasets: [
      {
        data: Object.values(grouped),
        backgroundColor: colorPalette,
      },
    ],
  };
}

/**
 *
 */
export function prepareNetWorthData(transactions: Transaction[]): ChartDataPoint[] {
  return transactions.map(txn => ({
    date: txn.date,
    value: txn.amount,
  }));
}
