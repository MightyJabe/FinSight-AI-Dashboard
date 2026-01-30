'use client';

import {
  AlertTriangle,
  Bell,
  CheckCircle,
  DollarSign,
  Lightbulb,
  Target,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useSession } from '@/components/providers/SessionProvider';
import type {
  BudgetAlert,
  BudgetRecommendation,
  SmartBudgetAnalysis,
} from '@/lib/budget-recommendations';

interface BudgetRecommendationsProps {
  className?: string;
}

/**
 * Budget Recommendations component that displays AI-powered budget suggestions and alerts
 */
export function BudgetRecommendations({ className = '' }: BudgetRecommendationsProps) {
  const { firebaseUser } = useSession();
  const [analysis, setAnalysis] = useState<SmartBudgetAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [acceptedRecommendations, setAcceptedRecommendations] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      setLoading(true);
      setError(null);

      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/budget-recommendations?includeAlerts=true', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch recommendations (${response.status})`);
      }

      const data = await response.json();
      if (data.success) {
        setAnalysis(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }
    } catch (err) {
      console.error('Error fetching budget recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  const acceptRecommendation = useCallback(
    async (category: string, recommendedBudget: number) => {
      if (!firebaseUser || !analysis) return;

      try {
        setUpdating(true);

        // Update local state immediately for better UX
        setAcceptedRecommendations(prev => new Set([...prev, category]));

        // Prepare updated budgets
        const currentBudgets: { [key: string]: number } = {};
        analysis.recommendedAllocations.forEach(rec => {
          if (rec.category === category) {
            currentBudgets[rec.category] = recommendedBudget;
          } else if (acceptedRecommendations.has(rec.category)) {
            currentBudgets[rec.category] = rec.recommendedBudget;
          } else {
            currentBudgets[rec.category] = rec.currentBudget;
          }
        });

        const idToken = await firebaseUser.getIdToken();
        const response = await fetch('/api/budget-recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            budgets: currentBudgets,
            acceptedRecommendations: [category],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to update budget');
        }

        // Refresh recommendations after update
        setTimeout(() => fetchRecommendations(), 1000);
      } catch (err) {
        console.error('Error accepting recommendation:', err);
        // Revert local state on error
        setAcceptedRecommendations(prev => {
          const newSet = new Set(prev);
          newSet.delete(category);
          return newSet;
        });
        setError(err instanceof Error ? err.message : 'Failed to update budget');
      } finally {
        setUpdating(false);
      }
    },
    [firebaseUser, analysis, acceptedRecommendations, fetchRecommendations]
  );

  const dismissAlert = useCallback((alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSeverityColor = (severity: BudgetAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 dark:bg-red-500/20 border-red-500/20 dark:border-red-500/30 text-red-600 dark:text-red-400';
      case 'high':
        return 'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/20 dark:border-orange-500/30 text-orange-600 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-500/10 dark:bg-yellow-500/20 border-yellow-500/20 dark:border-yellow-500/30 text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20 dark:border-blue-500/30 text-blue-600 dark:text-blue-400';
      default:
        return 'bg-secondary border-border text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: BudgetAlert['severity']) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Bell className="h-4 w-4" />;
      case 'low':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: BudgetRecommendation['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 dark:bg-red-500/20 border-red-500/20 dark:border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/10 dark:bg-yellow-500/20 border-yellow-500/20 dark:border-yellow-500/30';
      case 'low':
        return 'bg-green-500/10 dark:bg-green-500/20 border-green-500/20 dark:border-green-500/30';
      default:
        return 'bg-secondary border-border';
    }
  };

  if (loading) {
    return (
      <div className={`glass-card rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`glass-card rounded-xl p-6 ${className}`}>
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Analysis Unavailable</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={fetchRecommendations}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className={`glass-card rounded-xl p-6 ${className}`}>
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Budget Data</h3>
          <p className="text-muted-foreground">
            Add transactions to get personalized budget recommendations.
          </p>
        </div>
      </div>
    );
  }

  const visibleAlerts = analysis.alerts.filter(alert => !dismissedAlerts.has(alert.id));
  const topRecommendations = analysis.recommendedAllocations
    .filter(rec => rec.priority === 'high' || rec.potentialSavings > 50)
    .slice(0, 5);

  return (
    <div className={`glass-card rounded-xl ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg">
            <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Budget Recommendations</h3>
            <p className="text-sm text-muted-foreground">AI-powered budget optimization and alerts</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-secondary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-foreground">Savings Rate</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {analysis.insights.savingsRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              Target: {analysis.insights.recommendedSavingsRate}%
            </p>
          </div>

          <div className="bg-secondary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-foreground">Budget Efficiency</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {analysis.insights.budgetEfficiency.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">How well budgets match spending</p>
          </div>

          <div className="bg-secondary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-foreground">Potential Savings</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(
                analysis.recommendedAllocations.reduce((sum, rec) => sum + rec.potentialSavings, 0)
              )}
            </p>
            <p className="text-xs text-muted-foreground">From optimization</p>
          </div>
        </div>

        {/* Alerts */}
        {visibleAlerts.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Budget Alerts ({visibleAlerts.length})
            </h4>
            <div className="space-y-3">
              {visibleAlerts.slice(0, 4).map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(alert.severity)}
                      <div>
                        <h5 className="font-medium">{alert.title}</h5>
                        <p className="text-sm mt-1">{alert.message}</p>
                        <p className="text-xs mt-2 opacity-75">{alert.suggestedAction}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="p-1 hover:bg-black/10 rounded transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Recommendations */}
        {topRecommendations.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Top Recommendations
            </h4>
            <div className="space-y-4">
              {topRecommendations.map(recommendation => (
                <div
                  key={recommendation.category}
                  className={`p-4 rounded-lg border ${getPriorityColor(recommendation.priority)}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-foreground">{recommendation.category}</h5>
                      <p className="text-sm text-muted-foreground">{recommendation.reasoning}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          recommendation.priority === 'high'
                            ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                            : recommendation.priority === 'medium'
                              ? 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                              : 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                        }`}
                      >
                        {recommendation.priority} priority
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Current Spending:</span>
                      <p className="font-medium text-foreground">
                        {formatCurrency(recommendation.currentSpending)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recommended Budget:</span>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(recommendation.recommendedBudget)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Potential Savings:</span>
                      <p className="font-medium text-purple-600 dark:text-purple-400">
                        {formatCurrency(recommendation.potentialSavings)}
                      </p>
                    </div>
                  </div>

                  {!acceptedRecommendations.has(recommendation.category) && (
                    <button
                      onClick={() =>
                        acceptRecommendation(
                          recommendation.category,
                          recommendation.recommendedBudget
                        )
                      }
                      disabled={updating}
                      className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {updating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Accept Recommendation
                        </>
                      )}
                    </button>
                  )}

                  {acceptedRecommendations.has(recommendation.category) && (
                    <div className="w-full py-2 px-4 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Budget Updated
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        {analysis.actionItems.length > 0 && (
          <div className="bg-blue-500/10 dark:bg-blue-500/20 rounded-lg p-4">
            <h4 className="text-md font-semibold text-blue-600 dark:text-blue-400 mb-3">Next Steps</h4>
            <ul className="space-y-2">
              {analysis.actionItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  <span>
                    {item.title}: {item.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
