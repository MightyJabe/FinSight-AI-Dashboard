'use client';

import {
  AlertTriangle,
  BarChart3,
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useSession } from '@/components/providers/SessionProvider';
import type { CashFlowForecast, CashFlowPrediction } from '@/lib/cash-flow-forecasting';

interface CashFlowForecastProps {
  className?: string;
}

/**
 * Cash Flow Forecast component that displays predicted financial trends
 */
export function CashFlowForecast({ className = '' }: CashFlowForecastProps) {
  const { firebaseUser } = useSession();
  const [forecast, setForecast] = useState<CashFlowForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState(6);

  const fetchForecast = useCallback(
    async (months: number = 6) => {
      if (!firebaseUser) return;

      try {
        setLoading(true);
        setError(null);

        const idToken = await firebaseUser.getIdToken();
        const response = await fetch(
          `/api/cash-flow-forecast?months=${months}&includeRecurring=true`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch forecast (${response.status})`);
        }

        const data = await response.json();
        if (data.success) {
          setForecast(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch forecast');
        }
      } catch (err) {
        console.error('Error fetching cash flow forecast:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch forecast');
      } finally {
        setLoading(false);
      }
    },
    [firebaseUser]
  );

  useEffect(() => {
    fetchForecast(selectedMonths);
  }, [fetchForecast, selectedMonths]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  const getBalanceTrend = (predictions: CashFlowPrediction[]) => {
    if (predictions.length < 2) return 'stable';

    const firstBalance = predictions[0]?.predictedBalance ?? 0;
    const lastBalance = predictions[predictions.length - 1]?.predictedBalance ?? 0;

    if (lastBalance > firstBalance * 1.1) return 'increasing';
    if (lastBalance < firstBalance * 0.9) return 'decreasing';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <BarChart3 className="h-5 w-5 text-blue-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600 bg-green-50';
      case 'decreasing':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner message="Generating cash flow forecast..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Forecast Unavailable</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchForecast(selectedMonths)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Forecast Data</h3>
          <p className="text-gray-600">
            Unable to generate forecast. Please ensure you have transaction history.
          </p>
        </div>
      </div>
    );
  }

  const balanceTrend = getBalanceTrend(forecast.predictions);
  const lowestBalance = Math.min(...forecast.predictions.map(p => p.predictedBalance));
  const highestBalance = Math.max(...forecast.predictions.map(p => p.predictedBalance));

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Cash Flow Forecast</h3>
              <p className="text-sm text-gray-600">
                Predicted financial trends based on your history
              </p>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="months-select" className="text-sm text-gray-600">
              Forecast:
            </label>
            <select
              id="months-select"
              value={selectedMonths}
              onChange={e => setSelectedMonths(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Current Balance</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(forecast.currentBalance)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Avg Monthly Income</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(forecast.insights.avgMonthlyIncome)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Avg Monthly Expenses</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(forecast.insights.avgMonthlyExpenses)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              {getTrendIcon(balanceTrend)}
              <span className="text-sm font-medium text-gray-700">Trend</span>
            </div>
            <p
              className={`text-xl font-bold capitalize ${getTrendColor(balanceTrend).split(' ')[0]}`}
            >
              {balanceTrend}
            </p>
          </div>
        </div>

        {/* Forecast Chart/Table */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Monthly Predictions</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Month</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">Income</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">
                    Expenses
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">
                    Balance
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody>
                {forecast.predictions.map((prediction, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(prediction.date)}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-sm text-right text-green-600 font-medium">
                      {formatCurrency(prediction.predictedIncome)}
                    </td>
                    <td className="py-3 px-3 text-sm text-right text-red-600 font-medium">
                      {formatCurrency(prediction.predictedExpenses)}
                    </td>
                    <td
                      className={`py-3 px-3 text-sm text-right font-medium ${
                        prediction.predictedBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(prediction.predictedBalance)}
                    </td>
                    <td className="py-3 px-3 text-sm text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          prediction.confidence >= 0.7
                            ? 'bg-green-100 text-green-800'
                            : prediction.confidence >= 0.5
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {Math.round(prediction.confidence * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights and Recommendations */}
        {forecast.recommendations.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-md font-semibold text-blue-900 mb-3">Recommendations</h4>
            <ul className="space-y-2">
              {forecast.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Additional Insights */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Monthly Net Change:</span>{' '}
            <span
              className={
                forecast.insights.monthlyNetChange >= 0 ? 'text-green-600' : 'text-red-600'
              }
            >
              {formatCurrency(forecast.insights.monthlyNetChange)}
            </span>
          </div>
          <div>
            <span className="font-medium">Recurring Transactions:</span>{' '}
            {forecast.insights.recurringTransactions} detected
          </div>
          <div>
            <span className="font-medium">Balance Range:</span> {formatCurrency(lowestBalance)} to{' '}
            {formatCurrency(highestBalance)}
          </div>
          <div>
            <span className="font-medium">Volatility:</span>{' '}
            <span
              className={
                forecast.insights.volatility > forecast.insights.avgMonthlyIncome * 0.3
                  ? 'text-red-600'
                  : 'text-green-600'
              }
            >
              {formatCurrency(forecast.insights.volatility)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
