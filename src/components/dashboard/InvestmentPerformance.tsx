import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { BarChart2, HelpCircle, PieChart, TrendingUp } from 'lucide-react';

import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { formatCurrency, formatPercentage } from '@/utils/format';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface InvestmentAccountPerformanceData {
  id: string;
  name: string;
  balance: number;
  type: string;
  performance: {
    daily: number;
    monthly: number;
    yearly: number;
  };
}

interface InvestmentPerformanceProps {
  investmentAccounts: InvestmentAccountPerformanceData[];
}

/**
 * Displays investment performance metrics and asset allocation
 */
export function InvestmentPerformance({ investmentAccounts = [] }: InvestmentPerformanceProps) {
  const totalInvestment = investmentAccounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0;
  const averagePerformance = {
    daily:
      investmentAccounts?.reduce((sum, acc) => sum + acc.performance.daily, 0) /
        investmentAccounts?.length || 0,
    monthly:
      investmentAccounts?.reduce((sum, acc) => sum + acc.performance.monthly, 0) /
        investmentAccounts?.length || 0,
    yearly:
      investmentAccounts?.reduce((sum, acc) => sum + acc.performance.yearly, 0) /
        investmentAccounts?.length || 0,
  };

  // Get color class based on performance
  const getPerformanceColorClass = (value: number) => {
    return value >= 0 ? 'text-green-500' : 'text-rose-500';
  };

  // If no investment accounts, show empty state
  if (!investmentAccounts || investmentAccounts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Investment Performance</h3>
        <div className="text-center py-8 text-gray-500">
          <BarChart2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No investment accounts found.</p>
          <p className="text-sm">Add investment accounts to see performance metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold flex items-center">
          <TrendingUp className="mr-2 h-5 w-5" />
          Investment Performance
        </h3>
      </div>

      <div className="p-6">
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 flex items-center">
              Total Investment
              <UITooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>The total value of all your investment accounts combined.</p>
                </TooltipContent>
              </UITooltip>
            </p>
            <p className="text-xl font-bold">{formatCurrency(totalInvestment)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 flex items-center">
              Daily Return
              <UITooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>The average daily return across all your investment accounts.</p>
                </TooltipContent>
              </UITooltip>
            </p>
            <p
              className={`text-xl font-bold ${getPerformanceColorClass(averagePerformance.daily)}`}
            >
              {formatPercentage(averagePerformance.daily)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 flex items-center">
              Monthly Return
              <UITooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>The average monthly return across all your investment accounts.</p>
                </TooltipContent>
              </UITooltip>
            </p>
            <p
              className={`text-xl font-bold ${getPerformanceColorClass(averagePerformance.monthly)}`}
            >
              {formatPercentage(averagePerformance.monthly)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 flex items-center">
              Yearly Return
              <UITooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>The average yearly return across all your investment accounts.</p>
                </TooltipContent>
              </UITooltip>
            </p>
            <p
              className={`text-xl font-bold ${getPerformanceColorClass(averagePerformance.yearly)}`}
            >
              {formatPercentage(averagePerformance.yearly)}
            </p>
          </div>
        </div>

        {/* Investment Accounts Table */}
        <div className="mb-8">
          <h4 className="text-md font-medium mb-4">Account Performance</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3">Account</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Balance</th>
                  <th className="pb-3">Daily</th>
                  <th className="pb-3">Monthly</th>
                  <th className="pb-3">Yearly</th>
                </tr>
              </thead>
              <tbody>
                {investmentAccounts.map(account => (
                  <tr key={account.name} className="border-b">
                    <td className="py-3">{account.name}</td>
                    <td className="py-3">{account.type}</td>
                    <td className="py-3 font-medium">{formatCurrency(account.balance)}</td>
                    <td className={`py-3 ${getPerformanceColorClass(account.performance.daily)}`}>
                      {formatPercentage(account.performance.daily)}
                    </td>
                    <td className={`py-3 ${getPerformanceColorClass(account.performance.monthly)}`}>
                      {formatPercentage(account.performance.monthly)}
                    </td>
                    <td className={`py-3 ${getPerformanceColorClass(account.performance.yearly)}`}>
                      {formatPercentage(account.performance.yearly)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset Allocation - Show empty state since not implemented */}
        <div className="mb-8">
          <h4 className="text-md font-medium mb-4 flex items-center">
            <PieChart className="mr-2 h-4 w-4" />
            Asset Allocation
          </h4>
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <PieChart className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Asset allocation tracking not implemented yet.</p>
            <p className="text-sm">This feature will show your portfolio diversification.</p>
          </div>
        </div>

        {/* Historical Performance - Show empty state since not implemented */}
        <div>
          <h4 className="text-md font-medium mb-4 flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            Historical Performance
          </h4>
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Historical performance tracking not implemented yet.</p>
            <p className="text-sm">This feature will show your portfolio performance over time.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
