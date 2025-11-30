'use client';

import '@/lib/chart-setup';

import {
  AlertTriangle,
  Calendar,
  DollarSign,
  Lightbulb,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';

import { Skeleton } from '@/components/common/SkeletonLoader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { TrendAnalysisType, TrendTimeframe, useSpendingTrends } from '@/hooks/useSpendingTrends';

const CHART_COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00ff00',
  '#0088fe',
  '#00c49f',
  '#ffbb28',
  '#ff8042',
  '#8dd1e1',
];

export default function SpendingTrends() {
  const { trends, isLoading, error } = useSpendingTrends();
  const analyzeTrends = useCallback(() => {
    // Mock function for now
  }, []);
  const [timeframe, setTimeframe] = useState<TrendTimeframe>('6months');
  const [analysisType, setAnalysisType] = useState<TrendAnalysisType>('category');
  const [includeProjections, setIncludeProjections] = useState(false);

  // Load initial trends on component mount
  useEffect(() => {
    analyzeTrends();
  }, [analyzeTrends]);

  const handleAnalyze = () => {
    analyzeTrends();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentChange = (change: number) => {
    const isPositive = change > 0;
    return (
      <span className={`flex items-center gap-1 ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  const buildLineChart = (data: any[]) => ({
    labels: data.map(d => d.period),
    datasets: [
      {
        label: 'Amount',
        data: data.map(d => d.amount),
        borderColor: '#8884d8',
        backgroundColor: 'rgba(136,132,216,0.2)',
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 5,
      },
    ],
  });

  const buildBarChart = (data: any[], labelKey: string) => ({
    labels: data.map(d => d[labelKey]),
    datasets: [
      {
        label: 'Amount',
        data: data.map(d => d.amount),
        backgroundColor: 'rgba(136,132,216,0.5)',
        borderColor: '#8884d8',
        borderWidth: 1,
      },
    ],
  });

  const buildPieChart = (data: any[]) => ({
    labels: data.map(d => d.category),
    datasets: [
      {
        data: data.map(d => d.amount),
        backgroundColor: data.map((_: any, index: number) => CHART_COLORS[index % CHART_COLORS.length]),
        borderWidth: 1,
      },
    ],
  });

  const renderChart = () => {
    if (!trends || !trends.trends || trends.trends.length === 0) return null;

    switch (analysisType) {
      case 'monthly':
      case 'weekly':
      case 'daily':
        return (
          <div className="w-full h-[320px]">
            <Line
              data={buildLineChart(trends.trends)}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: context => `${formatCurrency(context.parsed.y || 0)}`,
                    },
                  },
                  legend: { display: false },
                },
                scales: {
                  x: { ticks: { maxRotation: 45, minRotation: 45 } },
                  y: {
                    ticks: {
                      callback: value => `$${(Number(value) / 1000).toFixed(1)}k`,
                    },
                  },
                },
              }}
            />
          </div>
        );

      case 'category':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="w-full h-[320px]">
              <Bar
                data={buildBarChart(trends.trends.slice(0, 10), 'category')}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: context => `${formatCurrency(context.parsed.y || 0)}`,
                      },
                    },
                    legend: { display: false },
                  },
                  scales: {
                    x: {
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: false,
                        font: { size: 10 },
                      },
                    },
                    y: {
                      ticks: {
                        callback: value => `$${(Number(value) / 1000).toFixed(1)}k`,
                      },
                    },
                  },
                }}
              />
            </div>

            <div className="w-full h-[320px]">
              <Pie
                data={buildPieChart(trends.trends.slice(0, 8))}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: context =>
                          `${context.label}: ${formatCurrency(context.parsed || 0)} (${context.formattedValue})`,
                      },
                    },
                    legend: { position: 'bottom' },
                  },
                }}
              />
            </div>
          </div>
        );

      case 'seasonal':
        return (
          <div className="w-full h-[320px]">
            <Bar
              data={buildBarChart(trends.trends, 'period')}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: context => `${formatCurrency(context.parsed.y || 0)}`,
                    },
                  },
                  legend: { display: false },
                },
                scales: {
                  y: {
                    ticks: {
                      callback: value => `$${(Number(value) / 1000).toFixed(1)}k`,
                    },
                  },
                },
              }}
            />
          </div>
        );

      case 'anomaly':
        return (
          <div className="w-full h-[320px]">
            <Bar
              data={buildBarChart(trends.trends, 'period')}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: context => `${formatCurrency(context.parsed.y || 0)}`,
                      title: items => `Date: ${items[0]?.label ?? ''}`,
                    },
                  },
                  legend: { display: false },
                },
                scales: {
                  x: { ticks: { maxRotation: 45, minRotation: 45 } },
                  y: {
                    ticks: {
                      callback: value => `$${Number(value).toFixed(0)}`,
                    },
                  },
                },
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex items-center justify-center">
          <Skeleton className="h-8 w-8 rounded-full" />
          <span className="ml-2">Analyzing spending patterns...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertTriangle className="w-5 h-5" />
          <span>Error analyzing trends: {error?.message || 'Failed to load spending trends'}</span>
        </div>
        <Button onClick={handleAnalyze} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Spending Trend Analysis
          </CardTitle>
          <CardDescription>
            Identify patterns and insights in your spending behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Timeframe</label>
              <Select
                value={timeframe}
                onChange={e => setTimeframe(e.target.value as TrendTimeframe)}
              >
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
                <option value="2years">Last 2 Years</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Analysis Type</label>
              <Select
                value={analysisType}
                onChange={e => setAnalysisType(e.target.value as TrendAnalysisType)}
              >
                <option value="category">By Category</option>
                <option value="monthly">Monthly Trends</option>
                <option value="weekly">Weekly Trends</option>
                <option value="daily">Daily Patterns</option>
                <option value="seasonal">Seasonal Analysis</option>
                <option value="anomaly">Anomaly Detection</option>
              </Select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeProjections}
                  onChange={e => setIncludeProjections(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Include Projections</span>
              </label>
            </div>

            <div className="flex items-end">
              <Button onClick={handleAnalyze} className="w-full">
                Analyze Trends
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {trends && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card variant="outline" hover>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold">{formatCurrency(trends.totalSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="outline" hover>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Average per Period</p>
                  <p className="text-2xl font-bold">{formatCurrency(trends.averagePerPeriod)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="outline" hover>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Data Points</p>
                  <p className="text-2xl font-bold">{trends.trends.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="outline" hover>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Analysis Type</p>
                  <p className="text-lg font-semibold capitalize">{trends.analysisType}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {trends && (
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chart">Chart View</TabsTrigger>
            <TabsTrigger value="data">Data Table</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            {trends.projections && <TabsTrigger value="projections">Projections</TabsTrigger>}
          </TabsList>

          <TabsContent value="chart" className="space-y-4">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Spending Trends Visualization</CardTitle>
              </CardHeader>
              <CardContent>{renderChart()}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Detailed Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">Period</th>
                        {analysisType === 'category' && (
                          <th className="border border-gray-300 px-4 py-2 text-left">Category</th>
                        )}
                        <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">
                          Transactions
                        </th>
                        {(analysisType === 'monthly' || analysisType === 'weekly') && (
                          <th className="border border-gray-300 px-4 py-2 text-right">% Change</th>
                        )}
                        {analysisType === 'anomaly' && (
                          <th className="border border-gray-300 px-4 py-2 text-center">Anomaly</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {trends.trends.map((trend: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{trend.period}</td>
                          {analysisType === 'category' && (
                            <td className="border border-gray-300 px-4 py-2">{trend.category}</td>
                          )}
                          <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                            {formatCurrency(trend.amount)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {trend.transactionCount}
                          </td>
                          {(analysisType === 'monthly' || analysisType === 'weekly') && (
                            <td className="border border-gray-300 px-4 py-2 text-right">
                              {trend.percentChange !== undefined
                                ? formatPercentChange(trend.percentChange)
                                : '-'}
                            </td>
                          )}
                          {analysisType === 'anomaly' && (
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              {trend.anomaly && <Badge variant="destructive">Anomaly</Badge>}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  AI-Generated Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trends.insights.map((insight: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400"
                    >
                      <p className="text-blue-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {trends.projections && (
            <TabsContent value="projections" className="space-y-4">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Spending Projections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">
                          Next Period Projection
                        </h4>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(trends.projections.nextPeriod)}
                        </p>
                      </div>

                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 mb-2">Confidence Level</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-yellow-200 rounded-full h-2">
                            <div
                              className="bg-yellow-600 h-2 rounded-full"
                              style={{ width: `${trends.projections.confidence}%` }}
                            />
                          </div>
                          <span className="text-yellow-700 font-semibold">
                            {trends.projections.confidence}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Contributing Factors</h4>
                      <div className="space-y-2">
                        {trends.projections.factors.map((factor: any, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="text-gray-700">{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}
