'use client';

import { AlertTriangle, BarChart3, DollarSign, Lightbulb, PieChart, Target } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { ChartSkeleton } from '@/components/common/SkeletonLoader';
import { useSession } from '@/components/providers/SessionProvider';

interface CategoryInsight {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface SpendingInsights {
  topCategories: CategoryInsight[];
  totalSpent: number;
  monthlyAverage: number;
  insights: string[];
  budgetRecommendations: Array<{
    category: string;
    recommendedBudget: number;
    reason: string;
  }>;
}

interface EnhancedSpendingInsightsProps {
  className?: string;
}

export function EnhancedSpendingInsights({ className = '' }: EnhancedSpendingInsightsProps) {
  const { firebaseUser } = useSession();
  const [insights, setInsights] = useState<SpendingInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      setLoading(true);
      setError(null);

      const idToken = await firebaseUser.getIdToken();

      // Fetch categorized transactions data
      const [categorizedResponse, statusResponse] = await Promise.all([
        fetch('/api/transactions/categorized', {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
        fetch('/api/transactions/categorize', {
          method: 'GET',
          headers: { Authorization: `Bearer ${idToken}` },
        }),
      ]);

      if (!categorizedResponse.ok || !statusResponse.ok) {
        throw new Error('Failed to fetch categorization data');
      }

      const categorizedData = await categorizedResponse.json();
      const statusData = await statusResponse.json();

      if (!categorizedData.success || !statusData.success) {
        throw new Error('Invalid response from categorization API');
      }

      // Process the data to create insights
      const categoryTotals = new Map<
        string,
        {
          amount: number;
          count: number;
          transactions: any[];
        }
      >();

      // Group transactions by category
      Object.entries(categorizedData.data.categorizedTransactions).forEach(
        ([, categoryInfo]: [string, any]) => {
          const category = categoryInfo.aiCategory;
          if (!categoryTotals.has(category)) {
            categoryTotals.set(category, { amount: 0, count: 0, transactions: [] });
          }

          const categoryData = categoryTotals.get(category)!;
          // Assume positive amounts for expenses (adjust based on your data structure)
          const amount = Math.abs(categoryInfo.amount || 0);
          categoryData.amount += amount;
          categoryData.count += 1;
          categoryData.transactions.push(categoryInfo);
        }
      );

      const totalSpent = Array.from(categoryTotals.values()).reduce(
        (sum, cat) => sum + cat.amount,
        0
      );

      // Create top categories with insights
      const topCategories: CategoryInsight[] = Array.from(categoryTotals.entries())
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          percentage: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0,
          transactionCount: data.count,
          trend: 'stable' as const, // Could be enhanced with historical data
          trendPercentage: 0,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8);

      // Generate insights based on spending patterns
      const generatedInsights: string[] = [];
      const budgetRecommendations: Array<{
        category: string;
        recommendedBudget: number;
        reason: string;
      }> = [];

      if (topCategories.length > 0) {
        const topCategory = topCategories[0];
        if (topCategory && topCategory.percentage > 30) {
          generatedInsights.push(
            `${topCategory.category} represents ${topCategory.percentage.toFixed(1)}% of your spending. Consider reviewing these expenses for potential savings.`
          );
        }

        // Add budget recommendations for top categories
        topCategories.slice(0, 3).forEach(category => {
          const recommendedBudget = category.amount * 0.9; // Suggest 10% reduction
          budgetRecommendations.push({
            category: category.category,
            recommendedBudget,
            reason: `Based on current spending of $${category.amount.toFixed(0)}, reducing by 10% could save $${(category.amount * 0.1).toFixed(0)} monthly.`,
          });
        });

        if (
          topCategories.some(
            cat =>
              cat.category.toLowerCase().includes('dining') ||
              cat.category.toLowerCase().includes('restaurant')
          )
        ) {
          generatedInsights.push(
            'Consider meal planning and cooking at home more often to reduce dining expenses.'
          );
        }

        if (
          topCategories.some(
            cat =>
              cat.category.toLowerCase().includes('subscription') ||
              cat.category.toLowerCase().includes('entertainment')
          )
        ) {
          generatedInsights.push(
            'Review your subscriptions and cancel unused services to optimize recurring expenses.'
          );
        }
      }

      setInsights({
        topCategories,
        totalSpent,
        monthlyAverage: totalSpent, // Could be enhanced with multi-month data
        insights: generatedInsights,
        budgetRecommendations,
      });
    } catch (err) {
      console.error('Error fetching spending insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to load spending insights');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">Failed to load spending insights: {error}</p>
        </div>
      </div>
    );
  }

  if (!insights || insights.topCategories.length === 0) {
    return (
      <div className={`rounded-lg border border-gray-200 bg-gray-50 p-6 text-center ${className}`}>
        <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No categorized spending data available</p>
        <p className="text-sm text-gray-500 mt-1">
          Categorize your transactions to see spending insights
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Spending Overview */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Spending Overview</h3>
          <DollarSign className="h-5 w-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(insights.totalSpent)}
            </p>
            <p className="text-sm text-gray-600">Total Spent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{insights.topCategories.length}</p>
            <p className="text-sm text-gray-600">Categories</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {insights.topCategories.reduce((sum, cat) => sum + cat.transactionCount, 0)}
            </p>
            <p className="text-sm text-gray-600">Transactions</p>
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Spending Categories</h3>
          <BarChart3 className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {insights.topCategories.map(category => (
            <div
              key={category.category}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{category.category}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(category.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">
                    {category.percentage.toFixed(1)}% • {category.transactionCount} transactions
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      {insights.insights.length > 0 && (
        <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
          </div>
          <div className="space-y-3">
            {insights.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white/70 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                </div>
                <p className="text-sm text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Recommendations */}
      {insights.budgetRecommendations.length > 0 && (
        <div className="rounded-lg border bg-gradient-to-br from-green-50 to-emerald-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Budget Recommendations</h3>
          </div>
          <div className="space-y-3">
            {insights.budgetRecommendations.map(rec => (
              <div key={rec.category} className="p-3 bg-white/70 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{rec.category}</span>
                  <span className="text-sm font-bold text-green-600">
                    {formatCurrency(rec.recommendedBudget)}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
