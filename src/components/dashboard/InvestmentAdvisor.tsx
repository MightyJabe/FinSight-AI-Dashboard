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
      <div className={`glass-card rounded-lg shadow-sm p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Investment Advisor</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-secondary rounded w-3/4"></div>
          <div className="h-4 bg-secondary rounded w-1/2"></div>
          <div className="h-32 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`glass-card rounded-lg shadow-sm p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Investment Advisor</h2>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={fetchAnalysis}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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
        return 'text-gain bg-gain/10';
      case 'moderate':
        return 'text-primary bg-primary/10';
      case 'aggressive':
        return 'text-[rgb(var(--gold))] bg-[rgb(var(--gold))]/10';
      case 'very aggressive':
        return 'text-loss bg-loss/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-loss/10 text-loss border-loss/20';
      case 'high':
        return 'bg-[rgb(var(--gold))]/10 text-[rgb(var(--gold))] border-[rgb(var(--gold))]/20';
      case 'medium':
        return 'bg-[rgb(var(--gold))]/5 text-[rgb(var(--gold))] border-[rgb(var(--gold))]/10';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className={`glass-card-strong rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Investment Advisor</h2>
              <p className="text-sm text-muted-foreground">AI-powered portfolio optimization</p>
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
        <div className="flex gap-1 mt-4 bg-secondary rounded-lg p-1">
          {(['overview', 'allocations', 'recommendations', 'performance'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedTab === tab
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
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
              <div className="bg-secondary rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Portfolio Value</div>
                <div className="text-2xl font-bold text-foreground">
                  ${analysis.totalValue.toLocaleString()}
                </div>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Risk Level</div>
                <div
                  className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${getRiskColor(analysis.riskAssessment.riskLevel)}`}
                >
                  {analysis.riskAssessment.riskLevel}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Score: {analysis.riskAssessment.riskScore}/10
                </div>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Annual Return</div>
                <div className="text-2xl font-bold text-foreground">
                  {analysis.performance.annualizedReturn}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  vs {analysis.performance.benchmark}: {analysis.performance.benchmarkReturn}%
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Key Insights</h3>
              <div className="space-y-2">
                {analysis.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-foreground">
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
              <div className="bg-[rgb(var(--gold))]/10 border border-[rgb(var(--gold))]/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-[rgb(var(--gold))]" />
                  <span className="font-medium text-[rgb(var(--gold))]">Rebalancing Recommended</span>
                </div>
                <p className="text-sm text-[rgb(var(--gold))]">
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
              <PieChart className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Asset Allocation</h3>
            </div>

            {analysis.allocations.map(allocation => (
              <AllocationCard key={allocation.assetClass} allocation={allocation} />
            ))}
          </div>
        )}

        {selectedTab === 'recommendations' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recommendations</h3>

            {analysis.recommendations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted" />
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
            <h3 className="text-lg font-semibold text-foreground mb-4">Performance Metrics</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {analysis.performance.totalReturn}%
                </div>
                <div className="text-sm text-muted-foreground">Total Return</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {analysis.performance.ytdReturn}%
                </div>
                <div className="text-sm text-muted-foreground">YTD Return</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {analysis.performance.alpha}%
                </div>
                <div className="text-sm text-muted-foreground">Alpha</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {analysis.riskAssessment.sharpeRatio}
                </div>
                <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
              </div>
            </div>

            <div className="bg-secondary rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-3">Risk Metrics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Volatility:</span>
                  <span className="ml-2 font-medium">{analysis.riskAssessment.volatility}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Beta:</span>
                  <span className="ml-2 font-medium">{analysis.riskAssessment.beta}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Diversification:</span>
                  <span className="ml-2 font-medium">
                    {analysis.riskAssessment.diversificationScore}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Risk Score:</span>
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
        return <ArrowUp className="h-4 w-4 text-gain" />;
      case 'sell':
        return <ArrowDown className="h-4 w-4 text-loss" />;
      default:
        return <ArrowRight className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="glass-card rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-foreground">{allocation.assetClass}</h4>
        <div className="flex items-center gap-2">
          {getRecommendationIcon(allocation.recommendation)}
          <span className="text-sm font-medium capitalize text-foreground">
            {allocation.recommendation}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Current:</span>
          <span className="font-medium">{allocation.currentPercentage}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Target:</span>
          <span className="font-medium">{allocation.targetPercentage}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Variance:</span>
          <span
            className={`font-medium ${allocation.variance > 0 ? 'text-loss' : allocation.variance < 0 ? 'text-gain' : 'text-foreground'}`}
          >
            {allocation.variance > 0 ? '+' : ''}
            {allocation.variance}%
          </span>
        </div>

        {allocation.recommendation !== 'hold' && (
          <div className="flex justify-between text-sm pt-2 border-t border-border">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-medium">${allocation.amount.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>0%</span>
          <span>Target: {allocation.targetPercentage}%</span>
          <span>100%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full relative"
            style={{ width: `${Math.min(100, allocation.currentPercentage)}%` }}
          >
            <div
              className="absolute top-0 w-0.5 h-2 bg-muted-foreground"
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
    <div className="glass-card rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-foreground">{recommendation.title}</h4>
        <span
          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(recommendation.priority)}`}
        >
          {recommendation.priority}
        </span>
      </div>

      <p className="text-sm text-foreground mb-3">{recommendation.description}</p>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">Expected Benefit:</span>
          <span className="ml-2">{recommendation.expectedBenefit}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Timeframe:</span>
          <span className="ml-2">{recommendation.timeframe}</span>
        </div>
      </div>

      {recommendation.steps && recommendation.steps.length > 0 && (
        <div className="mt-3">
          <div className="text-sm font-medium text-foreground mb-2">Action Steps:</div>
          <ul className="text-sm text-foreground space-y-1">
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
        <div className="mt-3 pt-3 border-t border-border flex justify-between text-sm">
          {recommendation.estimatedSavings && (
            <span className="text-gain">
              Potential Savings: ${recommendation.estimatedSavings.toLocaleString()}
            </span>
          )}
          {recommendation.estimatedCost && (
            <span className="text-muted-foreground">
              Est. Cost: ${recommendation.estimatedCost.toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
