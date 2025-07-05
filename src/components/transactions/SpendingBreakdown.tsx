'use client';

import { useEffect, useState, useCallback } from 'react';
import { PieChart, BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import { useSession } from '@/components/providers/SessionProvider';

interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  color: string;
}

interface SpendingData {
  totalSpent: number;
  totalIncome: number;
  netCashFlow: number;
  categories: CategorySpending[];
  period: string;
}


interface SpendingBreakdownProps {
  onCategoryFilter?: (category: string) => void;
  selectedCategory?: string | null;
}

export function SpendingBreakdown({ onCategoryFilter, selectedCategory }: SpendingBreakdownProps) {
  const { firebaseUser } = useSession();
  const [spendingData, setSpendingData] = useState<SpendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpendingData = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      setLoading(true);
      setError(null);

      const idToken = await firebaseUser.getIdToken();
      
      // Fetch categorized transactions
      const response = await fetch('/api/transactions/categorize', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch spending data');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      // Fetch the actual categorized transactions to build spending breakdown
      const categorizedResponse = await fetch('/api/transactions/spending-analysis', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (categorizedResponse.ok) {
        const analysisData = await categorizedResponse.json();
        if (analysisData.success) {
          setSpendingData(analysisData.data);
        }
      }

    } catch (err) {
      console.error('Error fetching spending data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch spending data');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchSpendingData();

    // Listen for categorization completion
    const handleRefresh = () => {
      setTimeout(() => fetchSpendingData(), 1000); // Small delay to ensure data is saved
    };
    
    window.addEventListener('categorization-complete', handleRefresh);
    return () => window.removeEventListener('categorization-complete', handleRefresh);
  }, [fetchSpendingData]);

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm border">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-6">
        <div className="flex items-center gap-2 text-red-800 mb-2">
          <TrendingUp className="h-5 w-5" />
          <span className="font-medium">Spending Analysis Error</span>
        </div>
        <p className="text-red-700 text-sm">{error}</p>
        <button
          onClick={fetchSpendingData}
          className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!spendingData || spendingData.categories.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-6">
        <div className="text-center">
          <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Spending Data</h3>
          <p className="text-gray-600 text-sm">
            Connect your bank account or categorize transactions to see spending breakdown.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Spending Breakdown</h3>
            <p className="text-sm text-gray-600">{spendingData.period}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/70 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-gray-700">Total Spent</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              ${Math.abs(spendingData.totalSpent).toLocaleString()}
            </p>
          </div>

          <div className="bg-white/70 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700">Total Income</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              ${spendingData.totalIncome.toLocaleString()}
            </p>
          </div>

          <div className="bg-white/70 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Net Flow</span>
            </div>
            <p className={`text-2xl font-bold ${spendingData.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${spendingData.netCashFlow >= 0 ? '+' : ''}${spendingData.netCashFlow.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="p-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Categories</h4>
        <div className="space-y-3">
          {spendingData.categories.map((category) => (
            <div key={category.category} className="flex items-center gap-4">
              {/* Color indicator */}
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.color }}
              />
              
              {/* Category info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <button
                    onClick={() => onCategoryFilter?.(category.category)}
                    className={`text-sm font-medium truncate text-left hover:text-blue-600 transition-colors ${
                      selectedCategory === category.category ? 'text-blue-600' : 'text-gray-900'
                    }`}
                    title="Click to filter transactions by this category"
                  >
                    {category.category}
                    {selectedCategory === category.category && ' (filtered)'}
                  </button>
                  <span className="text-sm text-gray-600">
                    {category.transactionCount} transaction{category.transactionCount !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${category.percentage}%`,
                      backgroundColor: category.color
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">
                    ${Math.abs(category.amount).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {category.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 pt-4 border-t">
          <button
            onClick={fetchSpendingData}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
          >
            <BarChart3 className="h-4 w-4" />
            Refresh Analysis
          </button>
        </div>
      </div>
    </div>
  );
}