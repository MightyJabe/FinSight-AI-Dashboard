import { Overview } from '@/types/finance';
import { NetWorthWidget } from '@/components/widgets/NetWorthWidget';

interface OverviewCardsProps {
  overview: Overview | undefined;
}

export function OverviewCards({ overview }: OverviewCardsProps) {
  if (!overview) return null;

  const totalAssets = overview.totalAssets ?? 0;
  const totalLiabilities = overview.totalLiabilities ?? 0;
  const monthlySavings = overview.monthlySavings ?? 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <NetWorthWidget data={overview} />
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-sm font-medium text-muted-foreground">Total Assets</h3>
        <p className="text-2xl font-bold mt-2">${totalAssets.toLocaleString()}</p>
      </div>
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-sm font-medium text-muted-foreground">Total Liabilities</h3>
        <p className="text-2xl font-bold mt-2">${totalLiabilities.toLocaleString()}</p>
      </div>
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-sm font-medium text-muted-foreground">Monthly Savings</h3>
        <p className="text-2xl font-bold mt-2">${monthlySavings.toLocaleString()}</p>
      </div>
    </div>
  );
}
