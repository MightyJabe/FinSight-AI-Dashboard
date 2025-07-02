'use client';

import { RefreshCw } from 'lucide-react';
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

/**
 *
 */
export default function InsightsPage() {
  const { user: _user, firebaseUser, loading: authLoading } = useSession();
  const [insightsData, setInsightsData] = useState<InsightsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

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
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">AI Insights</h1>
            <p className="mt-2 text-lg text-gray-600">
              Get personalized financial recommendations and insights powered by AI.
            </p>
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
  );
}
