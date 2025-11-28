'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiArrowRight, FiDollarSign, FiTrendingDown, FiTrendingUp } from 'react-icons/fi';

import type { PlatformSummary } from '@/types/platform';
import { formatCurrency } from '@/utils/format';

export default function InvestmentOverview() {
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const response = await fetch('/api/platforms');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch platforms');
      }

      setSummary(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platforms');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return null;
  }

  const isPositive = summary.totalProfit >= 0;
  const topPlatforms = [...summary.platforms]
    .sort((a, b) => b.currentBalance - a.currentBalance)
    .slice(0, 3);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Investment Platforms
          </h2>
          <Link
            href="/investments"
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
          >
            <span>View All</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <FiDollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Balance</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary.totalBalance)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {summary.platformCount} platforms
            </p>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-1">
              {isPositive ? (
                <FiTrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <FiTrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">Net Profit/Loss</span>
            </div>
            <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}
              {formatCurrency(summary.totalProfit)}
            </p>
            <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'} mt-1`}>
              {isPositive ? '+' : ''}
              {summary.totalProfitPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {topPlatforms.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Top Platforms
            </h3>
            <div className="space-y-2">
              {topPlatforms.map(platform => {
                const returnPercent = platform.netProfitPercent;
                const isPlatformPositive = returnPercent >= 0;

                return (
                  <div
                    key={platform.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {platform.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {platform.currency}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(platform.currentBalance)}
                      </p>
                      <p
                        className={`text-xs ${isPlatformPositive ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {isPlatformPositive ? '+' : ''}
                        {returnPercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {summary.platforms.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              No platforms tracked yet
            </p>
            <Link
              href="/investments"
              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            >
              <span>Add your first platform</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
