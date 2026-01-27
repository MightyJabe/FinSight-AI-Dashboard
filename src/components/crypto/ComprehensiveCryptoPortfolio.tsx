'use client';

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Bitcoin,
  Clock,
  DollarSign,
  Minus,
  PieChart,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { ErrorMessage } from '@/components/common/ErrorMessage';
import { ChartSkeleton } from '@/components/common/SkeletonLoader';
import { useCryptoPortfolio } from '@/hooks/use-crypto-portfolio';

const LineChart = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
const DoughnutChart = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), {
  ssr: false,
});

interface ComprehensiveCryptoPortfolioProps {
  className?: string;
}

export function ComprehensiveCryptoPortfolio({
  className = '',
}: ComprehensiveCryptoPortfolioProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'holdings' | 'allocation' | 'performance'
  >('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [chartsReady, setChartsReady] = useState(false);

  const {
    data,
    loading,
    error,
    hasData,
    isPositivePerformance,
    isDayPositive,
    refresh,
    formatCurrency,
    formatCrypto,
    formatPercentage,
    getPerformanceColor,
    getDiversificationLevel,
    getTopHoldings,
    getTopPerformers,
    getBottomPerformers,
    getPortfolioAllocation,
    lastRefresh,
  } = useCryptoPortfolio({
    autoRefresh,
    refreshInterval: 30000, // 30 seconds
    includeHistorical: true,
  });

  useEffect(() => {
    let mounted = true;
    import('chart.js/auto')
      .then(() => mounted && setChartsReady(true))
      .catch(() => mounted && setChartsReady(false));
    return () => {
      mounted = false;
    };
  }, []);

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
      <div className={`glass-card-strong rounded-2xl p-8 text-center ${className}`}>
        <Bitcoin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-bold gradient-text mb-2">No Crypto Holdings</h3>
        <p className="text-muted-foreground mb-6">
          Connect your crypto exchanges or add manual holdings to start tracking your portfolio.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a
            href="/investments"
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 glow-gradient"
          >
            Add Crypto Platform
          </a>
          <a
            href="/accounts"
            className="inline-flex items-center px-5 py-2.5 glass-card text-foreground rounded-xl font-medium border-white/20 hover:border-white/30 hover:bg-white/80 dark:hover:bg-slate-800/70 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            Connect Exchange
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

  const allocation = getPortfolioAllocation();
  const allocationChartData = {
    labels: allocation.map(a => a.symbol),
    datasets: [
      {
        data: allocation.map(a => a.percentage),
        backgroundColor: [
          '#F7931A', // Bitcoin orange
          '#627EEA', // Ethereum blue
          '#345D9D', // Cardano blue
          '#00D4AA', // BNB green
          '#FF6B35', // Solana orange
          '#6B46C1', // Polygon purple
          '#1652F0', // Coinbase blue
          '#7C3AED', // Chainlink purple
          '#059669', // Other green
          '#DC2626', // Other red
        ],
        borderWidth: 0,
      },
    ],
  };

  const topHoldings = getTopHoldings(5);
  const topPerformers = getTopPerformers(5);
  const bottomPerformers = getBottomPerformers(5);
  const diversification = getDiversificationLevel(data!.summary.diversificationScore);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bitcoin className="h-6 w-6 text-orange-500" />
            Crypto Portfolio
          </h2>
          <p className="text-sm text-gray-600">
            Real-time cryptocurrency portfolio tracking and analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Live:</span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                autoRefresh ? 'bg-green-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  autoRefresh ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Last Updated */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {lastRefresh ? `${lastRefresh.toLocaleTimeString()}` : 'Never'}
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
          <p className={`text-sm ${getPerformanceColor(data!.summary.totalGainLoss)}`}>
            {formatPercentage(data!.summary.totalGainLossPercent)} total
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">24h Change</span>
            {isDayPositive ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : data!.summary.dayChange < 0 ? (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <p className={`text-2xl font-bold ${getPerformanceColor(data!.summary.dayChange)}`}>
            {formatCurrency(data!.summary.dayChange)}
          </p>
          <p className={`text-sm ${getPerformanceColor(data!.summary.dayChangePercent)}`}>
            {formatPercentage(data!.summary.dayChangePercent)}
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Diversification</span>
            <Target className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data!.summary.diversificationScore.toFixed(0)}%
          </p>
          <p className={`text-xs ${diversification.color}`}>{diversification.level} diversity</p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Holdings</span>
            <PieChart className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{data!.summary.holdingsCount}</p>
          <p className="text-xs text-gray-500">
            {data!.summary.topGainer ? `Best: ${data!.summary.topGainer.symbol}` : 'No data'}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: Activity },
            { id: 'holdings', name: 'Holdings', icon: Bitcoin },
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
            {/* Portfolio Chart */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Portfolio Performance</h3>
              <div className="h-64">
                {chartsReady ? (
                  <LineChart
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
                            callback: value =>
                              formatCurrency(value as number, { minimumFractionDigits: 0 }),
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <ChartSkeleton />
                )}
              </div>
            </div>

            {/* Insights */}
            {data!.insights.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Crypto Insights</h3>
                </div>
                <div className="space-y-3">
                  {data!.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white/70 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-xs font-medium text-orange-600">{index + 1}</span>
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
            {/* Top Holdings */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-500" />
                Top Holdings
              </h3>
              <div className="space-y-3">
                {topHoldings.map(holding => (
                  <div
                    key={holding.symbol}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{holding.symbol[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{holding.symbol}</p>
                        <p className="text-sm text-gray-600">{holding.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(holding.value)}</p>
                      <p className="text-sm text-gray-600">
                        {formatCrypto(holding.amount)} {holding.symbol}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Leaders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <p className="text-sm text-gray-600">{formatCurrency(holding.value)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatPercentage(holding.gainLossPercent)}
                        </p>
                        <p className="text-sm text-green-600">{formatCurrency(holding.gainLoss)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Performers */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Needs Attention
                </h3>
                <div className="space-y-3">
                  {bottomPerformers.map(holding => (
                    <div
                      key={holding.symbol}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{holding.symbol}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(holding.value)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">
                          {formatPercentage(holding.gainLossPercent)}
                        </p>
                        <p className="text-sm text-red-600">{formatCurrency(holding.gainLoss)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'allocation' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Allocation Chart */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Portfolio Allocation</h3>
                <div className="h-64 flex items-center justify-center">
                  {chartsReady ? (
                    <DoughnutChart
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
                  ) : (
                    <ChartSkeleton />
                  )}
                </div>
              </div>

            {/* Allocation Breakdown */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Breakdown</h3>
              <div className="space-y-3">
                {allocation.map((item, index) => (
                  <div key={item.symbol} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{
                          backgroundColor:
                            (allocationChartData.datasets[0]?.backgroundColor as string[])?.[
                              index
                            ] || '#6B7280',
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900">{item.symbol}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {item.percentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-600">{formatCurrency(item.value)}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-medium text-gray-900 mb-2">Total Return</h4>
                <p
                  className={`text-2xl font-bold ${getPerformanceColor(data!.summary.totalGainLoss)}`}
                >
                  {formatCurrency(data!.summary.totalGainLoss)}
                </p>
                <p className={`text-sm ${getPerformanceColor(data!.summary.totalGainLossPercent)}`}>
                  {formatPercentage(data!.summary.totalGainLossPercent)} total
                </p>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-medium text-gray-900 mb-2">Cost Basis</h4>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data!.summary.totalCostBasis)}
                </p>
                <p className="text-sm text-gray-600">Total invested</p>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-medium text-gray-900 mb-2">24h Performance</h4>
                <p className={`text-2xl font-bold ${getPerformanceColor(data!.summary.dayChange)}`}>
                  {formatCurrency(data!.summary.dayChange)}
                </p>
                <p className={`text-sm ${getPerformanceColor(data!.summary.dayChangePercent)}`}>
                  {formatPercentage(data!.summary.dayChangePercent)}
                </p>
              </div>
            </div>

            {/* Risk Warning */}
            {data!.summary.diversificationScore < 30 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-medium text-yellow-800">Portfolio Risk Warning</h4>
                </div>
                <p className="text-sm text-yellow-700">
                  Your crypto portfolio has low diversification (
                  {data!.summary.diversificationScore.toFixed(0)}%). Consider spreading your
                  investments across more cryptocurrencies to reduce risk.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
