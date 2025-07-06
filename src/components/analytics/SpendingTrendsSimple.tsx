'use client';

import React, { useState, useEffect } from 'react';
import { useSpendingTrends, TrendTimeframe, TrendAnalysisType } from '@/hooks/useSpendingTrends';
import { Button } from '@/components/ui/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, AlertTriangle, Target, Lightbulb } from 'lucide-react';

const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
  '#0088fe', '#00c49f', '#ffbb28', '#ff8042', '#8dd1e1'
];

export default function SpendingTrends() {
  const { trends, loading, error, analyzeTrends } = useSpendingTrends();
  const [timeframe, setTimeframe] = useState<TrendTimeframe>('6months');
  const [analysisType, setAnalysisType] = useState<TrendAnalysisType>('category');
  const [includeProjections, setIncludeProjections] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');

  // Load initial trends on component mount
  useEffect(() => {
    analyzeTrends({ timeframe, analysisType, includeProjections });
  }, [analyzeTrends, timeframe, analysisType, includeProjections]);

  const handleAnalyze = () => {
    analyzeTrends({ timeframe, analysisType, includeProjections });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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

  const renderChart = () => {
    if (!trends || trends.trends.length === 0) return null;

    switch (analysisType) {
      case 'monthly':
      case 'weekly':
      case 'daily':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Amount']}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'category':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends.trends.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Amount']}
                  labelFormatter={(label) => `Category: ${label}`}
                />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={trends.trends.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => 
                    `${category}: ${(percent! * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {trends.trends.slice(0, 8).map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'seasonal':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trends.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
              <Bar dataKey="amount" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'anomaly':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trends.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Anomaly Amount']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Bar dataKey="amount" fill="#ff8042" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
          <span>Error analyzing trends: {error}</span>
        </div>
        <Button onClick={handleAnalyze} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Spending Trend Analysis</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Identify patterns and insights in your spending behavior
        </p>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Timeframe</label>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value as TrendTimeframe)}
              className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
              <option value="2years">Last 2 Years</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Analysis Type</label>
            <select 
              value={analysisType} 
              onChange={(e) => setAnalysisType(e.target.value as TrendAnalysisType)}
              className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            >
              <option value="category">By Category</option>
              <option value="monthly">Monthly Trends</option>
              <option value="weekly">Weekly Trends</option>
              <option value="daily">Daily Patterns</option>
              <option value="seasonal">Seasonal Analysis</option>
              <option value="anomaly">Anomaly Detection</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeProjections}
                onChange={(e) => setIncludeProjections(e.target.checked)}
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
      </div>

      {trends && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Spent</p>
                  <p className="text-2xl font-bold">{formatCurrency(trends.totalSpent)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Average per Period</p>
                  <p className="text-2xl font-bold">{formatCurrency(trends.averagePerPeriod)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Data Points</p>
                  <p className="text-2xl font-bold">{trends.trends.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Analysis Type</p>
                  <p className="text-lg font-semibold capitalize">{trends.analysisType}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6">
                {['chart', 'data', 'insights', trends.projections && 'projections'].filter(Boolean).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab!)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab === 'chart' && 'Chart View'}
                    {tab === 'data' && 'Data Table'}
                    {tab === 'insights' && 'Insights'}
                    {tab === 'projections' && 'Projections'}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'chart' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Spending Trends Visualization</h3>
                  {renderChart()}
                </div>
              )}

              {activeTab === 'insights' && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">AI-Generated Insights</h3>
                  </div>
                  <div className="space-y-3">
                    {trends.insights.map((insight, index) => (
                      <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-400">
                        <p className="text-blue-800 dark:text-blue-200">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Detailed Data</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700">
                          <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Period</th>
                          {analysisType === 'category' && <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Category</th>}
                          <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">Amount</th>
                          <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">Transactions</th>
                          {(analysisType === 'monthly' || analysisType === 'weekly') && (
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">% Change</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {trends.trends.map((trend, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{trend.period}</td>
                            {analysisType === 'category' && (
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{trend.category}</td>
                            )}
                            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold">
                              {formatCurrency(trend.amount)}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">
                              {trend.transactionCount}
                            </td>
                            {(analysisType === 'monthly' || analysisType === 'weekly') && (
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">
                                {trend.percentChange !== undefined ? formatPercentChange(trend.percentChange) : '-'}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'projections' && trends.projections && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Spending Projections</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Next Period Projection</h4>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {formatCurrency(trends.projections.nextPeriod)}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Confidence Level</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-yellow-200 dark:bg-yellow-700 rounded-full h-2">
                            <div 
                              className="bg-yellow-600 dark:bg-yellow-400 h-2 rounded-full"
                              style={{ width: `${trends.projections.confidence}%` }}
                            />
                          </div>
                          <span className="text-yellow-700 dark:text-yellow-300 font-semibold">
                            {trends.projections.confidence}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Contributing Factors</h4>
                      <div className="space-y-2">
                        {trends.projections.factors.map((factor, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="text-gray-700 dark:text-gray-300">{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}