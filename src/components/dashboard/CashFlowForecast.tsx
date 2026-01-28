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
        return <TrendingUp className="h-5 w-5 text-success" />;
      case 'decreasing':
        return <TrendingDown className="h-5 w-5 text-error" />;
      default:
        return <BarChart3 className="h-5 w-5 text-primary" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-success bg-success/10';
      case 'decreasing':
        return 'text-error bg-error/10';
      default:
        return 'text-primary bg-primary/10';
    }
  };

  if (loading) {
    return (
      <div className={`bg-surface-elevated/50 backdrop-blur-md rounded-xl shadow-elevated border border-border p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-surface-elevated/50 backdrop-blur-md rounded-xl shadow-elevated border border-border p-6 ${className}`}>
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-error mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Forecast Unavailable</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => fetchForecast(selectedMonths)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className={`bg-surface-elevated/50 backdrop-blur-md rounded-xl shadow-elevated border border-border p-6 ${className}`}>
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Forecast Data</h3>
          <p className="text-muted-foreground">
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
    <div className={`bg-surface-elevated/50 backdrop-blur-md rounded-xl shadow-elevated border border-border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Cash Flow Forecast</h3>
              <p className="text-sm text-muted-foreground">
                Predicted financial trends based on your history
              </p>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="months-select" className="text-sm text-muted-foreground">
              Forecast:
            </label>
            <select
              id="months-select"
              value={selectedMonths}
              onChange={e => setSelectedMonths(parseInt(e.target.value))}
              className="px-3 py-1 border border-border bg-surface rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
          <div className="bg-surface/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-foreground-secondary">Current Balance</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(forecast.currentBalance)}
            </p>
          </div>

          <div className="bg-surface/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground-secondary">Avg Monthly Income</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(forecast.insights.avgMonthlyIncome)}
            </p>
          </div>

          <div className="bg-surface/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-error" />
              <span className="text-sm font-medium text-foreground-secondary">Avg Monthly Expenses</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(forecast.insights.avgMonthlyExpenses)}
            </p>
          </div>

          <div className="bg-surface/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              {getTrendIcon(balanceTrend)}
              <span className="text-sm font-medium text-foreground-secondary">Trend</span>
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
          <h4 className="text-md font-semibold text-foreground mb-4">Monthly Predictions</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-sm font-medium text-foreground-secondary">Month</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Income</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">
                    Expenses
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">
                    Balance
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody>
                {forecast.predictions.map((prediction, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-3 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(prediction.date)}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-sm text-right text-success font-medium">
                      {formatCurrency(prediction.predictedIncome)}
                    </td>
                    <td className="py-3 px-3 text-sm text-right text-error font-medium">
                      {formatCurrency(prediction.predictedExpenses)}
                    </td>
                    <td
                      className={`py-3 px-3 text-sm text-right font-medium ${
                        prediction.predictedBalance >= 0 ? 'text-success' : 'text-error'
                      }`}
                    >
                      {formatCurrency(prediction.predictedBalance)}
                    </td>
                    <td className="py-3 px-3 text-sm text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          prediction.confidence >= 0.7
                            ? 'bg-success/10 text-success'
                            : prediction.confidence >= 0.5
                              ? 'bg-warning/10 text-warning'
                              : 'bg-error/10 text-error'
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
          <div className="bg-primary/5 backdrop-blur-sm rounded-lg p-4 border border-primary/10">
            <h4 className="text-md font-semibold text-foreground mb-3">Recommendations</h4>
            <ul className="space-y-2">
              {forecast.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-foreground-secondary">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>
                    {recommendation.title}: {recommendation.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Additional Insights */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground-secondary">Monthly Net Change:</span>{' '}
            <span
              className={
                forecast.insights.monthlyNetChange >= 0 ? 'text-success' : 'text-error'
              }
            >
              {formatCurrency(forecast.insights.monthlyNetChange)}
            </span>
          </div>
          <div>
            <span className="font-medium text-foreground-secondary">Recurring Transactions:</span>{' '}
            {forecast.insights.recurringTransactions} detected
          </div>
          <div>
            <span className="font-medium text-foreground-secondary">Balance Range:</span> {formatCurrency(lowestBalance)} to{' '}
            {formatCurrency(highestBalance)}
          </div>
          <div>
            <span className="font-medium text-foreground-secondary">Volatility:</span>{' '}
            <span
              className={
                forecast.insights.volatility > forecast.insights.avgMonthlyIncome * 0.3
                  ? 'text-error'
                  : 'text-success'
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
