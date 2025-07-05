'use client';

import { useEffect, useState, useCallback } from 'react';
import { Brain, CheckCircle, AlertCircle, Loader, Play, BarChart3 } from 'lucide-react';
import { useAICategorization } from '@/hooks/useAICategorization';

interface AICategorization {
  onCategorizationComplete?: () => void;
}

export function AICategorization({ onCategorizationComplete }: AICategorization) {
  const {
    categorizeAllTransactions,
    getCategorizationStatus,
    isLoading,
    error,
    clearError
  } = useAICategorization();

  const [status, setStatus] = useState<{
    total: number;
    categorized: number;
    uncategorized: number;
    percentage: number;
  } | null>(null);
  const [lastResult, setLastResult] = useState<{
    total: number;
    categorized: number;
    failed: number;
  } | null>(null);

  const loadStatus = useCallback(async () => {
    const statusData = await getCategorizationStatus();
    if (statusData) {
      setStatus(statusData);
    }
  }, [getCategorizationStatus]);

  // Load categorization status on mount
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleCategorizeAll = async () => {
    clearError();
    const result = await categorizeAllTransactions();
    
    if (result) {
      setLastResult(result.summary);
      await loadStatus(); // Refresh status
      onCategorizationComplete?.();
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (percentage >= 70) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
          <Brain className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Categorization</h3>
          <p className="text-sm text-gray-600">
            Automatically categorize your transactions for better insights
          </p>
        </div>
      </div>

      {/* Status Display */}
      {status && (
        <div className="mb-6 rounded-lg bg-white/70 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.percentage)}
              <span className="font-medium text-gray-900">Categorization Status</span>
            </div>
            <span className={`text-2xl font-bold ${getStatusColor(status.percentage)}`}>
              {status.percentage}%
            </span>
          </div>
          
          {status.total === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-2">No transactions found</p>
              <p className="text-xs text-gray-500">
                Connect your bank account with Plaid to start categorizing transactions
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Transactions:</span>
                  <span className="font-medium">{status.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">AI Categorized:</span>
                  <span className="font-medium text-green-600">{status.categorized.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Uncategorized:</span>
                  <span className="font-medium text-orange-600">{status.uncategorized.toLocaleString()}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${status.percentage}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Last Result */}
      {lastResult && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Last Categorization Complete</span>
          </div>
          <div className="text-xs text-green-700 space-y-1">
            <div>✓ {lastResult.categorized} transactions categorized</div>
            {lastResult.failed > 0 && (
              <div>⚠ {lastResult.failed} transactions failed</div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Error</span>
          </div>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleCategorizeAll}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isLoading ? 'Categorizing...' : 'Categorize All Transactions'}
        </button>

        <button
          onClick={loadStatus}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <BarChart3 className="h-4 w-4" />
          Refresh Status
        </button>
      </div>

      {/* Benefits List */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-2">Benefits of AI Categorization:</p>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• More accurate spending insights</li>
          <li>• Better budget tracking and recommendations</li>
          <li>• Automated pattern recognition</li>
          <li>• Natural language financial queries</li>
        </ul>
      </div>
    </div>
  );
}