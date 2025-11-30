'use client';

import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  PieChart,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import type { PortfolioAllocation, PortfolioAnalysis } from '@/lib/investment-advisor';

interface InvestmentAdvisorProps {
  className?: string;
}

/**
 * AI-powered Investment Advisor component
 */
export function InvestmentAdvisor({ className = '' }: InvestmentAdvisorProps) {
  const { firebaseUser } = useSession();
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'allocations' | 'recommendations' | 'performance'
  >('overview');

  const fetchAnalysis = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      setLoading(true);
      setError(null);
      const idToken = await firebaseUser.getIdToken();

      const response = await fetch('/api/investment-advisor?includeRebalancing=true', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalysis(data.data);
        } else {
          setError(data.error || 'Failed to fetch investment analysis');
        }
      } else {
        setError('Failed to fetch investment analysis');
      }
    } catch (err) {
      console.error('Error fetching investment analysis:', err);
      setError('Error loading investment recommendations');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-gray-900">Investment Advisor</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-gray-900">Investment Advisor</h2>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalysis}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'conservative':
        return 'text-green-600 bg-green-100';
      case 'moderate':
        return 'text-blue-600 bg-blue-100';
      case 'aggressive':
        return 'text-orange-600 bg-orange-100';
      case 'very aggressive':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Investment Advisor</h2>
              <p className="text-sm text-gray-600">AI-powered portfolio optimization</p>
            </div>
          </div>
          <button
            onClick={fetchAnalysis}
            className="px-4 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            Refresh Analysis
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mt-4 bg-gray-100 rounded-lg p-1">
          {(['overview', 'allocations', 'recommendations', 'performance'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Portfolio Value</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${analysis.totalValue.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Risk Level</div>
                <div
                  className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${getRiskColor(analysis.riskAssessment.riskLevel)}`}
                >
                  {analysis.riskAssessment.riskLevel}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Score: {analysis.riskAssessment.riskScore}/10
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Annual Return</div>
                <div className="text-2xl font-bold text-gray-900">
                  {analysis.performance.annualizedReturn}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  vs {analysis.performance.benchmark}: {analysis.performance.benchmarkReturn}%
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Insights</h3>
              <div className="space-y-2">
                {analysis.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <span>
                      {insight.title}: {insight.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rebalancing Alert */}
            {analysis.rebalancingNeeded && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Rebalancing Recommended</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Your portfolio has drifted from target allocations. Consider rebalancing by{' '}
                  {analysis.nextRebalanceDate}.
                </p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'allocations' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Asset Allocation</h3>
            </div>

            {analysis.allocations.map(allocation => (
              <AllocationCard key={allocation.assetClass} allocation={allocation} />
            ))}
          </div>
        )}

        {selectedTab === 'recommendations' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>

            {analysis.recommendations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Your portfolio looks well-optimized!</p>
                <p className="text-sm">Check back after market changes or contributions.</p>
              </div>
            ) : (
              analysis.recommendations.map((rec, index) => (
                <RecommendationCard
                  key={index}
                  recommendation={rec}
                  getPriorityColor={getPriorityColor}
                />
              ))
            )}
          </div>
        )}

        {selectedTab === 'performance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {analysis.performance.totalReturn}%
                </div>
                <div className="text-sm text-gray-600">Total Return</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {analysis.performance.ytdReturn}%
                </div>
                <div className="text-sm text-gray-600">YTD Return</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {analysis.performance.alpha}%
                </div>
                <div className="text-sm text-gray-600">Alpha</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {analysis.riskAssessment.sharpeRatio}
                </div>
                <div className="text-sm text-gray-600">Sharpe Ratio</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Risk Metrics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Volatility:</span>
                  <span className="ml-2 font-medium">{analysis.riskAssessment.volatility}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Beta:</span>
                  <span className="ml-2 font-medium">{analysis.riskAssessment.beta}</span>
                </div>
                <div>
                  <span className="text-gray-600">Diversification:</span>
                  <span className="ml-2 font-medium">
                    {analysis.riskAssessment.diversificationScore}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Risk Score:</span>
                  <span className="ml-2 font-medium">{analysis.riskAssessment.riskScore}/10</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface AllocationCardProps {
  allocation: PortfolioAllocation;
}

function AllocationCard({ allocation }: AllocationCardProps) {
  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'buy':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'sell':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <ArrowRight className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">{allocation.assetClass}</h4>
        <div className="flex items-center gap-2">
          {getRecommendationIcon(allocation.recommendation)}
          <span className="text-sm font-medium capitalize text-gray-700">
            {allocation.recommendation}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Current:</span>
          <span className="font-medium">{allocation.currentPercentage}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Target:</span>
          <span className="font-medium">{allocation.targetPercentage}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Variance:</span>
          <span
            className={`font-medium ${allocation.variance > 0 ? 'text-red-600' : allocation.variance < 0 ? 'text-green-600' : 'text-gray-900'}`}
          >
            {allocation.variance > 0 ? '+' : ''}
            {allocation.variance}%
          </span>
        </div>

        {allocation.recommendation !== 'hold' && (
          <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium">${allocation.amount.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>0%</span>
          <span>Target: {allocation.targetPercentage}%</span>
          <span>100%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full relative"
            style={{ width: `${Math.min(100, allocation.currentPercentage)}%` }}
          >
            <div
              className="absolute top-0 w-0.5 h-2 bg-gray-600"
              style={{
                left: `${(allocation.targetPercentage / Math.max(allocation.currentPercentage, allocation.targetPercentage)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: any;
  getPriorityColor: (priority: string) => string;
}

function RecommendationCard({ recommendation, getPriorityColor }: RecommendationCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
        <span
          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(recommendation.priority)}`}
        >
          {recommendation.priority}
        </span>
      </div>

      <p className="text-sm text-gray-700 mb-3">{recommendation.description}</p>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-600">Expected Benefit:</span>
          <span className="ml-2">{recommendation.expectedBenefit}</span>
        </div>
        <div>
          <span className="text-gray-600">Timeframe:</span>
          <span className="ml-2">{recommendation.timeframe}</span>
        </div>
      </div>

      {recommendation.steps && recommendation.steps.length > 0 && (
        <div className="mt-3">
          <div className="text-sm font-medium text-gray-900 mb-2">Action Steps:</div>
          <ul className="text-sm text-gray-700 space-y-1">
            {recommendation.steps.map((step: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(recommendation.estimatedSavings || recommendation.estimatedCost) && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
          {recommendation.estimatedSavings && (
            <span className="text-green-600">
              Potential Savings: ${recommendation.estimatedSavings.toLocaleString()}
            </span>
          )}
          {recommendation.estimatedCost && (
            <span className="text-gray-600">
              Est. Cost: ${recommendation.estimatedCost.toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
