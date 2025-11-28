'use client';

import { useEffect, useState } from 'react';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import type { Budget, InvestmentAccounts, Liabilities, Overview } from '@/types/finance';

interface DashboardData {
  overview: Overview | null;
  budget: Budget | null;
  investmentAccounts: InvestmentAccounts | null;
  liabilities: Liabilities | null;
}

/**
 * Dashboard page with client-side data fetching and authentication guard
 */
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    overview: null,
    budget: null,
    investmentAccounts: null,
    liabilities: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data from API endpoints instead of server-side functions
      const [overviewRes, budgetRes, investmentRes, liabilitiesRes] = await Promise.all([
        fetch('/api/overview').then(res => res.json()),
        fetch('/api/budget').then(res => res.json()),
        fetch('/api/investment-accounts').then(res => res.json()),
        fetch('/api/liabilities').then(res => res.json()),
      ]);

      // Handle successful responses
      const overview = overviewRes.success ? overviewRes.data : null;
      const budget = budgetRes.success ? budgetRes.data : null;
      const investmentAccounts = investmentRes.success ? investmentRes.data : null;
      const liabilities = liabilitiesRes.success ? liabilitiesRes.data : null;

      setData({
        overview,
        budget,
        investmentAccounts,
        liabilities,
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="max-w-full">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Get a complete overview of your financial health and insights.
            </p>
          </div>
          <ErrorMessage message={error} />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="max-w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Get a complete overview of your financial health and insights.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6">
            {data.overview && data.budget && data.investmentAccounts && data.liabilities ? (
              <DashboardContent
                overview={data.overview}
                budget={data.budget}
                liabilities={data.liabilities}
              />
            ) : (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <LoadingSpinner />
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
