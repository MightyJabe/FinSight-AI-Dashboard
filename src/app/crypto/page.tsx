'use client';

import { Activity, AlertTriangle, Bitcoin, DollarSign, Plus, TrendingUp } from 'lucide-react';
import { useState } from 'react';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ComprehensiveCryptoPortfolio } from '@/components/crypto/ComprehensiveCryptoPortfolio';
import { useCryptoPortfolio } from '@/hooks/useCryptoPortfolio';

export default function CryptoPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, loading, hasData, formatCurrency, formatPercentage } = useCryptoPortfolio({
    autoRefresh: true,
    refreshInterval: 30000,
  });

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Bitcoin className="h-8 w-8 text-orange-500" />
                Cryptocurrency Portfolio
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your crypto investments with real-time prices and advanced analytics
              </p>
            </div>

            {hasData && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Holdings
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Bar */}
        {hasData && data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium opacity-90">Portfolio Value</span>
                <DollarSign className="h-4 w-4 opacity-90" />
              </div>
              <p className="text-2xl font-bold">{formatCurrency(data.summary.totalValue)}</p>
              <p className="text-sm opacity-90">
                {formatPercentage(data.summary.totalGainLossPercent)} total return
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium opacity-90">24h Change</span>
                <TrendingUp className="h-4 w-4 opacity-90" />
              </div>
              <p
                className={`text-2xl font-bold ${data.summary.dayChange >= 0 ? 'text-white' : 'text-red-200'}`}
              >
                {formatCurrency(data.summary.dayChange)}
              </p>
              <p className="text-sm opacity-90">
                {formatPercentage(data.summary.dayChangePercent)}
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium opacity-90">Holdings</span>
                <Activity className="h-4 w-4 opacity-90" />
              </div>
              <p className="text-2xl font-bold">{data.summary.holdingsCount}</p>
              <p className="text-sm opacity-90">
                {data.summary.diversificationScore.toFixed(0)}% diversified
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium opacity-90">Best Performer</span>
                <TrendingUp className="h-4 w-4 opacity-90" />
              </div>
              <p className="text-xl font-bold">{data.summary.topGainer?.symbol || 'N/A'}</p>
              <p className="text-sm opacity-90">
                {data.summary.topGainer
                  ? formatPercentage(data.summary.topGainer.gainLossPercent)
                  : 'No data'}
              </p>
            </div>
          </div>
        )}

        {/* Risk Alerts */}
        {hasData && data && data.summary.diversificationScore < 30 && (
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <h3 className="font-medium text-yellow-800">Portfolio Risk Alert</h3>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                Your portfolio has low diversification (
                {data.summary.diversificationScore.toFixed(0)}%). Consider spreading investments
                across more cryptocurrencies to reduce risk.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
              >
                Diversify Portfolio
              </button>
            </div>
          </div>
        )}

        {/* Main Portfolio Component */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6">
            <ComprehensiveCryptoPortfolio />
          </div>
        </div>

        {/* Educational Note */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">📚 Cryptocurrency Investment Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-1">Diversification</h4>
              <p>
                Spread investments across different cryptocurrencies, market caps, and use cases.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Dollar-Cost Averaging</h4>
              <p>Invest fixed amounts regularly to reduce the impact of volatility.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Research</h4>
              <p>Understand the technology, team, and use case before investing.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Risk Management</h4>
              <p>Only invest what you can afford to lose. Crypto is highly volatile.</p>
            </div>
          </div>
        </div>

        {/* Add Holdings Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add Crypto Holdings
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                To add crypto holdings, connect your exchange accounts or manually add platforms in
                the Investments section.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <a
                  href="/investments"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Go to Investments
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
