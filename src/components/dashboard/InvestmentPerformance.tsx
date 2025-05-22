import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  ChartType,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tick,
  Title,
  Tooltip,
  TooltipItem,
} from 'chart.js';
import { BarChart2, HelpCircle, PieChart, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';

import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { formatCurrency, formatPercentage } from '@/utils/format';
import { getCssVarColor } from '@/utils/get-css-var-color';
import { toRgba } from '@/utils/to-rgba';

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
  assetAllocation: Array<{
    type: string;
    amount: number;
    target: number;
  }>;
  historicalPerformance: Array<{
    date: string;
    value: number;
  }>;
}

/**
 * Displays investment performance metrics and asset allocation
 */
export function InvestmentPerformance({
  investmentAccounts = [],
  assetAllocation = [],
  historicalPerformance = [],
}: InvestmentPerformanceProps) {
  const performanceChartRef = useRef<ChartJS<'line'>>(null);
  const allocationChartRef = useRef<ChartJS<'pie'>>(null);

  // Dynamic theme colors for charts
  const [chartColors, setChartColors] = useState({
    blue: getCssVarColor('--blue-600'),
    green: getCssVarColor('--green-500'),
    amber: getCssVarColor('--amber-500'),
    purple: getCssVarColor('--purple-500'),
    rose: getCssVarColor('--rose-500'),
    yellow: getCssVarColor('--yellow-500'),
    teal: getCssVarColor('--teal-500'),
    slate: getCssVarColor('--slate-500'),
  });

  useEffect(() => {
    setChartColors({
      blue: getCssVarColor('--blue-600'),
      green: getCssVarColor('--green-500'),
      amber: getCssVarColor('--amber-500'),
      purple: getCssVarColor('--purple-500'),
      rose: getCssVarColor('--rose-500'),
      yellow: getCssVarColor('--yellow-500'),
      teal: getCssVarColor('--teal-500'),
      slate: getCssVarColor('--slate-500'),
    });
  }, []);

  // Cleanup Chart.js instances on unmount
  useEffect(() => {
    const performanceChart = performanceChartRef.current;
    const allocationChart = allocationChartRef.current;

    return () => {
      if (performanceChart) {
        performanceChart.destroy();
      }
      if (allocationChart) {
        allocationChart.destroy();
      }
    };
  }, []);

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

  const safeAssetAllocation = assetAllocation || [];
  const safeHistoricalPerformance = historicalPerformance || [];

  // Get color class based on performance
  const getPerformanceColorClass = (value: number) => {
    return value >= 0 ? 'text-green-500' : 'text-rose-500';
  };

  // Get color class based on allocation difference
  const getAllocationColorClass = (difference: number) => {
    return difference > 0 ? 'bg-green-500' : 'bg-rose-500';
  };

  // Prepare data for asset allocation pie chart
  const allocationPieData = {
    labels: safeAssetAllocation.map(asset => asset.type),
    datasets: [
      {
        data: safeAssetAllocation.map(asset => asset.amount),
        backgroundColor: [
          chartColors.blue,
          chartColors.green,
          chartColors.amber,
          chartColors.purple,
          chartColors.rose,
          chartColors.yellow,
          chartColors.teal,
          chartColors.slate,
        ],
      },
    ],
  };

  // Prepare data for historical performance line chart
  const historicalPerformanceData = {
    labels: safeHistoricalPerformance.map(d => d.date),
    datasets: [
      {
        label: 'Portfolio Value',
        data: safeHistoricalPerformance.map(d => d.value),
        borderColor: chartColors.blue,
        backgroundColor: toRgba(chartColors.blue, 0.12), // 12% opacity
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Investment Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              Investment Performance
              <UITooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Overview of your investment portfolio performance, including total value,
                    returns, and asset allocation.
                  </p>
                </TooltipContent>
              </UITooltip>
            </h2>
            <BarChart2 className="h-5 w-5 text-blue-600" />
          </div>
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

        {/* Asset Allocation */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              Asset Allocation
              <UITooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    The distribution of your investments across different asset classes, compared to
                    your target allocation.
                  </p>
                </TooltipContent>
              </UITooltip>
            </h2>
            <PieChart className="h-5 w-5 text-green-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-64 flex items-center justify-center">
              <Pie
                data={allocationPieData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                      callbacks: {
                        label: (context: TooltipItem<ChartType>) => {
                          const value = context.raw as number;
                          const percentage = (value / totalInvestment) * 100;
                          return `${context.label}: ${formatCurrency(value)} (${formatPercentage(percentage)})`;
                        },
                      },
                    },
                  },
                }}
                ref={allocationChartRef}
              />
            </div>
            <div className="space-y-4">
              {safeAssetAllocation.map(asset => {
                const currentPercentage = (asset.amount / totalInvestment) * 100;
                const targetPercentage = asset.target;
                const difference = currentPercentage - targetPercentage;

                return (
                  <div key={asset.type} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{asset.type}</span>
                      <span>{formatPercentage(currentPercentage)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className={`h-full rounded-full ${getAllocationColorClass(difference)}`}
                        style={{ width: `${currentPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Target: {formatPercentage(targetPercentage)}</span>
                      <span className={getPerformanceColorClass(difference)}>
                        {formatPercentage(Math.abs(difference))} {difference > 0 ? 'over' : 'under'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Historical Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              Historical Performance
              <UITooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    The historical value of your investment portfolio over time, showing growth and
                    trends.
                  </p>
                </TooltipContent>
              </UITooltip>
            </h2>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <div className="h-64">
            <Line
              data={historicalPerformanceData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    ticks: {
                      callback: (tickValue: string | number, _index: number, _ticks: Tick[]) => {
                        if (typeof tickValue === 'number') {
                          return formatCurrency(tickValue);
                        }
                        return tickValue;
                      },
                    },
                  },
                },
              }}
              ref={performanceChartRef}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
