'use client';

import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';

interface Insights {
  insights: string[];
  metrics: {
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    spendingByCategory: Record<string, number>;
    monthlySpending: number;
  };
}

/**
 *
 */
export default function InsightsPage() {
  const { user, loading: authLoading } = useSession();
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = useCallback(
    async (forceRefresh = false) => {
      try {
        if (authLoading) {
          return; // Wait for auth to finish loading
        }

        if (!user) {
          setError('Please log in to view insights');
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();
        console.log('Got user token');

        const response = await fetch(`/api/insights${forceRefresh ? '?force=true' : ''}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch insights');
        }

        const data = await response.json();
        setInsights(data);
      } catch (err) {
        console.error('Error fetching insights:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authLoading, user]
  );

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInsights(true);
  };

  if (authLoading || loading) {
    return <div className="p-4">Loading insights...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!insights) {
    return <div className="p-4">No insights available</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Financial Insights</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Insights'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Net Worth</h2>
          <p className="text-2xl">${insights.metrics.netWorth.toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Monthly Spending</h2>
          <p className="text-2xl">${insights.metrics.monthlySpending.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">AI-Generated Insights</h2>
        <ul className="list-disc pl-5">
          {insights.insights.map((insight, index) => (
            <li key={index} className="mb-2">
              {insight}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Spending by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(insights.metrics.spendingByCategory).map(([category, amount]) => (
            <div key={category} className="p-2">
              <p className="font-medium">{category}</p>
              <p className="text-lg">${amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
