'use client';

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
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  DollarSign,
  Lightbulb,
  Minus,
  PieChart,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';

import { ErrorMessage } from '@/components/common/ErrorMessage';
import { ChartSkeleton } from '@/components/common/SkeletonLoader';
import { useInvestmentPerformance } from '@/hooks/useInvestmentPerformance';

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

type TimePeriod = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'ALL' },
];

interface ComprehensiveInvestmentPerformanceProps {
  className?: string;
}

export function ComprehensiveInvestmentPerformance({
  className = '',
}: ComprehensiveInvestmentPerformanceProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'holdings' | 'allocation' | 'performance'
  >('overview');

  const {
    data,
    loading,
    error,
    selectedPeriod,
    changePeriod,
    refresh,
    getPerformanceColor,
    formatPerformance,
    getRiskBadgeColor,
    getTopPerformers,
    getBottomPerformers,
    hasData,
    isPositivePerformance,
    diversificationScore,
    performanceGrade,
  } = useInvestmentPerformance({
    period: '1M',
    includeAssetAllocation: true,
    includeHistorical: true,
    autoRefresh: true,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refresh} className={className} />;
  }

  if (!hasData) {
    return (
      <div className={`rounded-lg border border-gray-200 bg-gray-50 p-8 text-center ${className}`}>
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Investment Data</h3>
        <p className="text-gray-600 mb-4">
          Connect your investment accounts or add manual portfolios to see performance analytics.
        </p>
        <div className="space-x-3">
          <a
            href="/accounts"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect Accounts
          </a>
          <a
            href="/investments"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Add Manual Portfolio
          </a>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const lineChartData = {
    labels: data!.historicalData.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Portfolio Value',
        data: data!.historicalData.map(d => d.value),
        borderColor: isPositivePerformance ? '#10B981' : '#EF4444',
        backgroundColor: isPositivePerformance
          ? 'rgba(16, 185, 129, 0.1)'
          : 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const allocationChartData = {
    labels: data!.assetAllocation.map(a => a.category),
    datasets: [
      {
        data: data!.assetAllocation.map(a => a.percentage),
        backgroundColor: data!.assetAllocation.map(a => a.color),
        borderWidth: 0,
      },
    ],
  };

  const topPerformers = getTopPerformers(5);
  const bottomPerformers = getBottomPerformers(5);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Investment Performance</h2>
          <p className="text-sm text-gray-600">
            Track your portfolio performance and asset allocation
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {PERIOD_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => changePeriod(option.value)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  selectedPeriod === option.value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={refresh}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Value</span>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(data!.summary.totalValue)}
          </p>
          <p className={`text-sm ${getPerformanceColor(data!.performance.totalGainLoss)}`}>
            {formatPerformance(data!.performance.totalGainLossPercent)} total
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Today&apos;s Change</span>
            {data!.performance.dailyReturn > 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : data!.performance.dailyReturn < 0 ? (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <p className={`text-2xl font-bold ${getPerformanceColor(data!.performance.dailyReturn)}`}>
            {formatPerformance(data!.performance.dailyReturn)}
          </p>
          <p className="text-xs text-gray-500">Daily return</p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Diversification</span>
            <Target className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{diversificationScore.toFixed(0)}%</p>
          <p className="text-xs text-gray-500">
            {diversificationScore > 70
              ? 'Well diversified'
              : diversificationScore > 40
                ? 'Moderately diversified'
                : 'Low diversification'}
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Performance Grade</span>
            <Award className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{performanceGrade}</p>
          <p className={`text-xs ${getPerformanceColor(data!.performance.yearlyReturn)}`}>
            {formatPerformance(data!.performance.yearlyReturn)} yearly
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'holdings', name: 'Holdings', icon: DollarSign },
            { id: 'allocation', name: 'Allocation', icon: PieChart },
            { id: 'performance', name: 'Performance', icon: TrendingUp },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* Performance Chart */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Portfolio Performance</h3>
              <div className="h-64">
                <Line
                  data={lineChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: {
                        beginAtZero: false,
                        ticks: {
                          callback: value => formatCurrency(value as number),
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Key Insights */}
            {data!.insights.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
                </div>
                <div className="space-y-3">
                  {data!.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white/70 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <p className="text-sm text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'holdings' && (
          <div className="space-y-6">
            {/* Top Performers */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Top Performers
              </h3>
              <div className="space-y-3">
                {topPerformers.map(holding => (
                  <div
                    key={holding.symbol}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{holding.symbol}</p>
                      <p className="text-sm text-gray-600">{holding.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatPerformance(holding.gainLossPercent || 0)}
                      </p>
                      <p className="text-sm text-gray-600">{formatCurrency(holding.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Performers */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Bottom Performers
              </h3>
              <div className="space-y-3">
                {bottomPerformers.map(holding => (
                  <div
                    key={holding.symbol}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{holding.symbol}</p>
                      <p className="text-sm text-gray-600">{holding.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        {formatPerformance(holding.gainLossPercent || 0)}
                      </p>
                      <p className="text-sm text-gray-600">{formatCurrency(holding.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'allocation' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Allocation Chart */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Asset Allocation</h3>
              <div className="h-64 flex items-center justify-center">
                <Doughnut
                  data={allocationChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Allocation Breakdown */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Breakdown</h3>
              <div className="space-y-3">
                {data!.assetAllocation.map(allocation => (
                  <div key={allocation.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: allocation.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {allocation.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {allocation.percentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-600">{formatCurrency(allocation.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-medium text-gray-900 mb-2">Volatility</h4>
                <p className="text-2xl font-bold text-gray-900">
                  {data!.performance.volatility.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Annualized</p>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-medium text-gray-900 mb-2">Sharpe Ratio</h4>
                <p className="text-2xl font-bold text-gray-900">
                  {data!.performance.sharpeRatio.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Risk-adjusted return</p>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-medium text-gray-900 mb-2">Total Return</h4>
                <p
                  className={`text-2xl font-bold ${getPerformanceColor(data!.performance.totalGainLoss)}`}
                >
                  {formatCurrency(data!.performance.totalGainLoss)}
                </p>
                <p className="text-sm text-gray-600">All time</p>
              </div>
            </div>

            {/* Account Performance */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Account Performance</h3>
              <div className="space-y-3">
                {data!.accountPerformance.map(account => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{account.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getRiskBadgeColor(account.performance.risk)}`}
                        >
                          {account.performance.risk} Risk
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{account.type}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(account.balance)}</p>
                      <p className={`text-sm ${getPerformanceColor(account.performance.monthly)}`}>
                        {formatPerformance(account.performance.monthly)} monthly
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
