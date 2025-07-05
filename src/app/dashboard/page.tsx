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
    <DashboardContent
      overview={overview}
      budget={budget}
      investmentAccounts={investmentAccounts}
      liabilities={liabilities}
    />
  );
}
