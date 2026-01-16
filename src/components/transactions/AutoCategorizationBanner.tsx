'use client';

import { ArrowRight, Brain, CheckCircle, X, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useAICategorization } from '@/hooks/use-ai-categorization';

interface AutoCategorizationBannerProps {
  onStartCategorization?: () => void;
}

export function AutoCategorizationBanner({ onStartCategorization }: AutoCategorizationBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { getCategorizationStatus, categorizeAllTransactions, isLoading } = useAICategorization();
  const [status, setStatus] = useState<{
    total: number;
    categorized: number;
    uncategorized: number;
    percentage: number;
  } | null>(null);

  const checkCategorizationStatus = useCallback(async () => {
    const statusData = await getCategorizationStatus();
    if (statusData) {
      setStatus(statusData);
      // Don't show banner if already mostly categorized
      if (statusData.percentage >= 80) {
        setIsDismissed(true);
      }
    }
  }, [getCategorizationStatus]);

  useEffect(() => {
    checkCategorizationStatus();
  }, [checkCategorizationStatus]);

  const handleStartCategorization = async () => {
    onStartCategorization?.();
    const result = await categorizeAllTransactions();
    if (result) {
      setShowSuccess(true);
      setTimeout(() => {
        setIsDismissed(true);
        setShowSuccess(false);
      }, 3000);
    }
  };

  if (isDismissed || !status || status.total === 0) {
    return null;
  }

  if (showSuccess) {
    return (
      <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800">AI Categorization Complete! 🎉</h3>
            <p className="text-xs text-green-700 mt-1">
              Your transactions have been automatically categorized for better insights.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border border-purple-200 p-4 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-blue-500">
          <Brain className="h-5 w-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {status.categorized > 0
                ? 'Complete AI Categorization'
                : 'Upgrade to AI Smart Categorization'}
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              <Zap className="h-3 w-3" />
              AI Enhanced
            </span>
          </div>

          <div className="mb-3">
            <p className="text-sm text-gray-700">
              {status.categorized > 0
                ? `${status.uncategorized} transactions need AI categorization (${status.percentage.toFixed(0)}% complete)`
                : `Your ${status.total} transactions are using smart pattern matching. Upgrade to AI for personalized categorization.`}
            </p>
            {status.categorized === 0 && (
              <p className="text-xs text-blue-600 mt-1 font-medium">
                ✓ Basic categorization active • Upgrade for AI learning & accuracy
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStartCategorization}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  {status.categorized > 0 ? 'Complete AI Analysis' : 'Upgrade to AI Categorization'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {status.categorized > 0 && (
              <div className="text-xs text-gray-600">
                ✓ {status.categorized} already categorized
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
            <span>• AI learns your spending patterns</span>
            <span>• Personalized category suggestions</span>
            <span>• Advanced financial insights</span>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
