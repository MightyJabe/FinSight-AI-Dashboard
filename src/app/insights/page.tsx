'use client';

import { CreditCard, PieChart, Receipt, RefreshCw, Target, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import InsightCard from '@/components/insights/InsightCard';
import MetricDisplay from '@/components/insights/MetricDisplay';
import PlaidDataWarning from '@/components/insights/PlaidDataWarning';
import SpendingByCategoryDisplay from '@/components/insights/SpendingByCategoryDisplay';
import { useSession } from '@/components/providers/SessionProvider';

interface InsightData {
  title: string;
  description: string;
  actionItems: string[];
  priority: 'high' | 'medium' | 'low';
}

interface InsightsPageData {
  insights: InsightData[];
  summary: string;
  nextSteps: string[];
  metrics: {
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    spendingByCategory: Record<string, number>;
    monthlySpending: number | Record<string, number>;
  };
  plaidDataAvailable?: boolean;
}

function AnalysisButton({ function: fn, label }: { function: string; label: string }) {
  const { firebaseUser } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const icons: Record<string, any> = {
    analyzeBudget: PieChart,
    optimizeInvestments: TrendingUp,
    findTaxDeductions: Receipt,
    createDebtPayoffPlan: CreditCard,
    planSavingsGoal: Target,
  };
  const Icon = icons[fn];

  const handleClick = async () => {
    setLoading(true);
    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch('/api/ai/specialized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ function: fn, params: {} }),
      });
      const data = await res.json();
      setResult(data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all disabled:opacity-50"
      >
        <Icon className="h-6 w-6 mx-auto mb-2 text-blue-600" />
        <p className="text-sm font-medium text-gray-900">{label}</p>
      </button>
      {result && (
        <div className="mt-2 p-3 bg-blue-50 rounded text-xs">
          <p className="font-semibold mb-1">Insights:</p>
          {result.insights?.map((i: string, idx: number) => (
            <p key={idx}>• {i}</p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 *
 */
export default function InsightsPage() {
  const { firebaseUser, loading: authLoading } = useSession();
  const [insightsData, setInsightsData] = useState<InsightsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  const fetchInsights = useCallback(
    async (forceRefresh = false) => {
      // Reset error state on new fetch attempt, except when it's just auth loading
      if (!authLoading) setError(null);
      // Set loading to true only if not already refreshing, to avoid UI flicker
      if (!refreshing) setLoading(true);

      try {
        if (authLoading) {
          return;
        }

        if (!firebaseUser) {
          setError('Please log in to view insights');
          setLoading(false);
          return;
        }

        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/insights${forceRefresh ? '?force=true' : ''}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: 'Failed to fetch insights' }));
          throw new Error(errorData.message || `Failed to fetch insights (${response.status})`);
        }

        const data = await response.json();
        // Ensure the data is properly serialized before setting state
        const serializedData = {
          ...data,
          metrics: {
            ...data.metrics,
            spendingByCategory: data.metrics.spendingByCategory || {},
            monthlySpending: data.metrics.monthlySpending || {},
          },
          insights: data.insights || [],
          nextSteps: data.nextSteps || [],
          summary: data.summary || '',
          plaidDataAvailable: Boolean(data.plaidDataAvailable),
        };
        setInsightsData(serializedData);
      } catch (err) {
        console.error('Error fetching insights:', err);
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred while fetching insights'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authLoading, firebaseUser, refreshing]
  );

  const fetchAlerts = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/alerts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchInsights();
    fetchAlerts();
  }, [fetchInsights, fetchAlerts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInsights(true);
  };

  if (authLoading || (loading && !insightsData)) {
    // Show loading if auth is loading OR initial data load is in progress
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen flex justify-center items-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen flex justify-center items-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-xl">
          <h2 className="text-xl font-semibold text-red-600 mb-3">Oops! Something went wrong.</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => fetchInsights()}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!insightsData) {
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen flex justify-center items-center">
        <p className="text-lg text-gray-500">
          No insights available at the moment. Try refreshing.
        </p>
      </div>
    );
  }

  const totalMonthlySpending =
    typeof insightsData.metrics.monthlySpending === 'number'
      ? insightsData.metrics.monthlySpending
      : typeof insightsData.metrics.monthlySpending === 'object' &&
          insightsData.metrics.monthlySpending !== null
        ? Object.values(insightsData.metrics.monthlySpending as Record<string, number>).reduce(
            (s, v) => s + v,
            0
          )
        : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">AI Insights</h1>
          <p className="mt-2 text-lg text-gray-600">
            Get personalized financial recommendations and insights powered by AI.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Your Financial Insights</h2>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading} // Disable if refreshing or initial loading
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-start sm:self-center"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing || loading ? 'animate-spin' : ''}`} />
                {refreshing || loading ? 'Refreshing...' : 'Refresh Insights'}
              </button>
            </div>

            {insightsData.plaidDataAvailable === false && <PlaidDataWarning />}

            {/* Quick Analysis Tools */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Quick Analysis</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <AnalysisButton function="analyzeBudget" label="Budget" />
                <AnalysisButton function="optimizeInvestments" label="Investments" />
                <AnalysisButton function="findTaxDeductions" label="Tax" />
                <AnalysisButton function="createDebtPayoffPlan" label="Debt" />
                <AnalysisButton function="planSavingsGoal" label="Savings" />
              </div>
            </div>

            {/* Automated Alerts Section */}
            {!alertsLoading && alerts.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Smart Alerts</h2>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map(alert => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.priority === 'high'
                          ? 'bg-red-50 border-red-500'
                          : alert.priority === 'medium'
                            ? 'bg-yellow-50 border-yellow-500'
                            : 'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{alert.title}</h3>
                          <p className="text-sm text-gray-700">{alert.message}</p>
                          {alert.actionUrl && (
                            <a
                              href={alert.actionUrl}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                            >
                              View Details →
                            </a>
                          )}
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const token = await firebaseUser?.getIdToken();
                              await fetch(`/api/alerts/${alert.id}`, {
                                method: 'PATCH',
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              setAlerts(alerts.filter(a => a.id !== alert.id));
                            } catch (err) {
                              console.error('Failed to dismiss alert:', err);
                            }
                          }}
                          className="text-gray-400 hover:text-gray-600 ml-4"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <MetricDisplay
                title="Net Worth"
                value={insightsData.metrics.netWorth}
                valuePrefix="$"
                isLoading={loading}
              />
              <MetricDisplay
                title="Total Monthly Spending"
                value={totalMonthlySpending}
                valuePrefix="$"
                isLoading={loading}
              />
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">AI-Generated Insights</h2>
              {loading && !insightsData.insights.length ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-lg p-5">
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {insightsData.summary && (
                    <p className="mb-6 text-gray-700 bg-blue-50 p-4 rounded-lg shadow">
                      <strong>Summary:</strong> {insightsData.summary}
                    </p>
                  )}
                  <div className="space-y-4">
                    {insightsData.insights.map((insight, index) => (
                      <InsightCard key={index} insight={insight} index={index} />
                    ))}
                  </div>
                  {insightsData.nextSteps && insightsData.nextSteps.length > 0 && (
                    <div className="mt-6 bg-green-50 p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold text-green-700 mb-2">Next Steps:</h3>
                      <ul className="list-disc pl-5 text-green-700 space-y-1">
                        {insightsData.nextSteps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>

            <SpendingByCategoryDisplay
              spendingData={insightsData.metrics.spendingByCategory}
              isLoading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
