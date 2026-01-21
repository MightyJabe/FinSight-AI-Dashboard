'use client';

/**
 * Net Worth History Chart
 *
 * Displays historical net worth data from daily snapshots.
 * Supports period selection and drill-down on data points.
 */

import type { Chart as ChartJS } from 'chart.js';
import { HelpCircle, Minus,TrendingDown, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import { memo, useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

import type { NetWorthHistoryPoint,NetWorthHistoryResponse } from '@/app/api/net-worth/history/route';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { formatCurrency, formatDate } from '@/utils/format';
import { getCssVarColor } from '@/utils/get-css-var-color';
import { toRgba } from '@/utils/to-rgba';

const LineChart = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), { ssr: false });

type Period = '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface NetWorthHistoryChartProps {
  className?: string;
}

const periodLabels: Record<Period, string> = {
  '1M': '1 Month',
  '3M': '3 Months',
  '6M': '6 Months',
  '1Y': '1 Year',
  'ALL': 'All Time',
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const NetWorthHistoryChart = memo(function NetWorthHistoryChart({
  className = '',
}: NetWorthHistoryChartProps) {
  const [period, setPeriod] = useState<Period>('3M');
  const [selectedPoint, setSelectedPoint] = useState<NetWorthHistoryPoint | null>(null);
  const chartRef = useRef<ChartJS<'line'>>(null);

  const [chartColors, setChartColors] = useState({
    primary: getCssVarColor('--primary'),
    green: getCssVarColor('--green-500'),
    rose: getCssVarColor('--rose-500'),
  });

  // Fetch historical data
  const { data, error, isLoading } = useSWR<NetWorthHistoryResponse>(
    `/api/net-worth/history?period=${period}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  useEffect(() => {
    setChartColors({
      primary: getCssVarColor('--primary'),
      green: getCssVarColor('--green-500'),
      rose: getCssVarColor('--rose-500'),
    });
  }, []);

  // Cleanup chart on unmount
  useEffect(() => {
    const chart = chartRef.current;
    return () => {
      if (chart) {
        try {
          chart.destroy();
        } catch (e) {
          console.warn('Error destroying chart:', e);
        }
      }
    };
  }, []);

  // Calculate trend
  const getTrend = () => {
    if (!data?.data?.points || data.data.points.length < 2) return null;

    const points = data.data.points;
    const first = points[0];
    const last = points[points.length - 1];
    if (!first || !last) return null;

    const firstValue = first.netWorth;
    const lastValue = last.netWorth;
    const change = lastValue - firstValue;
    const percentChange = firstValue !== 0 ? (change / Math.abs(firstValue)) * 100 : 0;

    return { change, percentChange };
  };

  const trend = getTrend();

  // Prepare chart data
  const chartData = {
    labels: data?.data?.points.map((p) => formatDate(p.date)) ?? [],
    datasets: [
      {
        label: 'Net Worth',
        data: data?.data?.points.map((p) => p.netWorth) ?? [],
        borderColor: chartColors.primary,
        backgroundColor: toRgba(chartColors.primary, 0.1),
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: { parsed: { y: number | null } }) => {
            const value = context.parsed.y;
            return value !== null ? `Net Worth: ${formatCurrency(value)}` : '';
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (value: any) => {
            if (typeof value === 'number') {
              // Compact format for axis labels
              const absValue = Math.abs(value);
              if (absValue >= 1_000_000) {
                return `$${(value / 1_000_000).toFixed(1)}M`;
              } else if (absValue >= 1_000) {
                return `$${(value / 1_000).toFixed(0)}K`;
              }
              return `$${value.toFixed(0)}`;
            }
            return value;
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data?.success) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Net Worth History
        </h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No historical data available yet.</p>
          <p className="text-sm mt-2">Snapshots will be created daily.</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data.data?.points.length) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Net Worth History
        </h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No snapshots found for this period.</p>
          <p className="text-sm mt-2">Try selecting a different time range.</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Net Worth History
            </h2>
            <UITooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Historical net worth tracked from daily snapshots.</p>
                <p className="text-xs mt-1">Click on a data point to see breakdown.</p>
              </TooltipContent>
            </UITooltip>
          </div>

          {/* Period selector */}
          <div className="flex gap-1">
            {(Object.keys(periodLabels) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Trend indicator */}
        {trend && (
          <div className="flex items-center gap-2 mb-4">
            {trend.change > 0 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : trend.change < 0 ? (
              <TrendingDown className="h-5 w-5 text-rose-500" />
            ) : (
              <Minus className="h-5 w-5 text-gray-400" />
            )}
            <span
              className={`text-sm font-medium ${
                trend.change > 0
                  ? 'text-green-600 dark:text-green-400'
                  : trend.change < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-gray-500'
              }`}
            >
              {trend.change >= 0 ? '+' : ''}
              {formatCurrency(trend.change)} ({trend.percentChange >= 0 ? '+' : ''}
              {trend.percentChange.toFixed(1)}%)
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              over {periodLabels[period].toLowerCase()}
            </span>
          </div>
        )}

        {/* Chart */}
        <div className="h-64">
          <LineChart ref={chartRef} data={chartData} options={chartOptions} />
        </div>

        {/* Selected point details */}
        {selectedPoint && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatDate(selectedPoint.date)}
              </span>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Net Worth</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(selectedPoint.netWorth)}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Assets</span>
                <p className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(selectedPoint.totalAssets)}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Liabilities</span>
                <p className="font-semibold text-rose-600 dark:text-rose-400">
                  {formatCurrency(selectedPoint.totalLiabilities)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
});

export default NetWorthHistoryChart;
