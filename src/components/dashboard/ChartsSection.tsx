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
import { HelpCircle, PieChart, TrendingUp } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';

import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import type { Overview } from '@/types/finance';
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

interface ChartsSectionProps {
  overview: Overview;
}

/**
 * Optimized charts section with memoization and proper cleanup
 */
export const ChartsSection = memo(function ChartsSection({ overview }: ChartsSectionProps) {
  const { netWorthHistory, monthlyIncome, monthlyExpenses, monthlySavings, accounts, liabilities } =
    overview;

  const netWorthChartRef = useRef<ChartJS<'line'>>(null);
  const cashFlowChartRef = useRef<ChartJS<'pie'>>(null);
  const assetAllocationChartRef = useRef<ChartJS<'pie'>>(null);
  const liabilityBreakdownChartRef = useRef<ChartJS<'pie'>>(null);

  const [chartColors, setChartColors] = useState({
    primary: getCssVarColor('--primary'),
    green: getCssVarColor('--green-500'),
    rose: getCssVarColor('--rose-500'),
    blue: getCssVarColor('--blue-600'),
    amber: getCssVarColor('--amber-500'),
    purple: getCssVarColor('--purple-500'),
  });

  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    setChartColors({
      primary: getCssVarColor('--primary'),
      green: getCssVarColor('--green-500'),
      rose: getCssVarColor('--rose-500'),
      blue: getCssVarColor('--blue-600'),
      amber: getCssVarColor('--amber-500'),
      purple: getCssVarColor('--purple-500'),
    });
  }, []);

  // Cleanup Chart.js instances on unmount
  useEffect(() => {
    const charts = [
      netWorthChartRef.current,
      cashFlowChartRef.current,
      assetAllocationChartRef.current,
      liabilityBreakdownChartRef.current,
    ];

    return () => {
      charts.forEach(chart => {
        if (chart) {
          try {
            chart.destroy();
          } catch (error) {
            console.warn('Error destroying chart:', error);
          }
        }
      });
    };
  }, []);

  // Error boundary for chart rendering
  const renderChart = (chartComponent: React.ReactNode) => {
    // No try/catch here; React error boundaries should handle errors
    return chartComponent;
  };

  if (chartError) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Financial Charts</h3>
        <div className="text-center py-8 text-red-500">
          <p>{chartError}</p>
          <button
            onClick={() => setChartError(null)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Defensive: Ensure arrays for .map usage
  const safeNetWorthHistory = Array.isArray(netWorthHistory) ? netWorthHistory : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeLiabilities = Array.isArray(liabilities) ? liabilities : [];

  // Prepare chart data
  const netWorthData = {
    labels: safeNetWorthHistory.map(d => d.date),
    datasets: [
      {
        label: 'Net Worth',
        data: safeNetWorthHistory.map(d => d.value),
        borderColor: chartColors.primary,
        backgroundColor: toRgba(chartColors.primary, 0.1),
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const cashFlowData = {
    labels: ['Income', 'Expenses', 'Savings'],
    datasets: [
      {
        data: [monthlyIncome, monthlyExpenses, monthlySavings],
        backgroundColor: [chartColors.green, chartColors.rose, chartColors.blue],
      },
    ],
  };

  const assetAllocationData = {
    labels: safeAccounts.map(acc => acc.name),
    datasets: [
      {
        data: safeAccounts.map(acc => acc.balance),
        backgroundColor: [
          chartColors.blue,
          chartColors.green,
          chartColors.amber,
          chartColors.purple,
          chartColors.rose,
        ],
      },
    ],
  };

  const liabilityBreakdownData = {
    labels: safeLiabilities.map(l => l.name),
    datasets: [
      {
        data: safeLiabilities.map(l => l.amount),
        backgroundColor: [
          chartColors.rose,
          chartColors.amber,
          chartColors.purple,
          chartColors.blue,
          chartColors.green,
        ],
      },
    ],
  };

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Net Worth Trend */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              Net Worth Trend
              <UITooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your net worth over time, showing growth and trends.</p>
                </TooltipContent>
              </UITooltip>
            </h2>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div className="h-64">
            {renderChart(
              <Line
                data={netWorthData}
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
                ref={netWorthChartRef}
              />
            )}
          </div>
        </div>

        {/* Cash Flow */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              Monthly Cash Flow
              <UITooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Breakdown of your monthly income, expenses, and savings.</p>
                </TooltipContent>
              </UITooltip>
            </h2>
            <PieChart className="h-5 w-5 text-green-500" />
          </div>
          <div className="h-64">
            {renderChart(
              <Pie
                data={cashFlowData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                      callbacks: {
                        label: (context: TooltipItem<ChartType>) => {
                          const value = context.raw as number;
                          const total = monthlyIncome + monthlyExpenses + monthlySavings;
                          const percentage = total > 0 ? (value / total) * 100 : 0;
                          return `${context.label}: ${formatCurrency(value)} (${formatPercentage(percentage)})`;
                        },
                      },
                    },
                  },
                }}
                ref={cashFlowChartRef}
              />
            )}
          </div>
        </div>

        {/* Asset Allocation */}
        {accounts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                Asset Allocation
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The distribution of your assets across different accounts.</p>
                  </TooltipContent>
                </UITooltip>
              </h2>
              <PieChart className="h-5 w-5 text-blue-500" />
            </div>
            <div className="h-64">
              {renderChart(
                <Pie
                  data={assetAllocationData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' },
                      tooltip: {
                        callbacks: {
                          label: (context: TooltipItem<ChartType>) => {
                            const value = context.raw as number;
                            const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);
                            const percentage = total > 0 ? (value / total) * 100 : 0;
                            return `${context.label}: ${formatCurrency(value)} (${formatPercentage(percentage)})`;
                          },
                        },
                      },
                    },
                  }}
                  ref={assetAllocationChartRef}
                />
              )}
            </div>
          </div>
        )}

        {/* Liability Breakdown */}
        {liabilities.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                Liability Breakdown
                <UITooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The distribution of your debts across different liabilities.</p>
                  </TooltipContent>
                </UITooltip>
              </h2>
              <PieChart className="h-5 w-5 text-red-500" />
            </div>
            <div className="h-64">
              {renderChart(
                <Pie
                  data={liabilityBreakdownData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' },
                      tooltip: {
                        callbacks: {
                          label: (context: TooltipItem<ChartType>) => {
                            const value = context.raw as number;
                            const total = liabilities.reduce((sum, l) => sum + l.amount, 0);
                            const percentage = total > 0 ? (value / total) * 100 : 0;
                            return `${context.label}: ${formatCurrency(value)} (${formatPercentage(percentage)})`;
                          },
                        },
                      },
                    },
                  }}
                  ref={liabilityBreakdownChartRef}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
});
