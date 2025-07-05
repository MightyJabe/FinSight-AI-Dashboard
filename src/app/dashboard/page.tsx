import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { getBudget, getInvestmentAccounts, getLiabilities, getOverview } from '@/lib/finance';

/**
 *
 */
export default async function DashboardPage() {
  // Fetch all data on the server
  const [overview, budget, investmentAccounts, liabilities] = await Promise.all([
    getOverview(),
    getBudget(),
    getInvestmentAccounts(),
    getLiabilities(),
  ]);

  return (
    <div className="max-w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">
          Get a complete overview of your financial health and insights.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <DashboardContent
            overview={overview}
            budget={budget}
            investmentAccounts={investmentAccounts}
            liabilities={liabilities}
          />
        </div>
      </div>
    </div>
  );
}
