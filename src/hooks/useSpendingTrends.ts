import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import logger from '@/lib/logger';

export type TrendTimeframe = '3months' | '6months' | '1year' | '2years';
export type TrendAnalysisType = 'category' | 'monthly' | 'weekly' | 'daily' | 'seasonal' | 'anomaly';

export interface TrendData {
  period: string;
  amount: number;
  transactionCount: number;
  category?: string;
  percentChange?: number;
  anomaly?: boolean;
}

export interface SpendingTrends {
  timeframe: string;
  analysisType: string;
  totalSpent: number;
  averagePerPeriod: number;
  trends: TrendData[];
  insights: string[];
  projections?: {
    nextPeriod: number;
    confidence: number;
    factors: string[];
  };
}

export interface TrendAnalysisParams {
  timeframe?: TrendTimeframe;
  analysisType?: TrendAnalysisType;
  categories?: string[];
  includeProjections?: boolean;
}

export interface UseSpendingTrendsReturn {
  trends: SpendingTrends | null;
  loading: boolean;
  error: string | null;
  analyzeTrends: (params?: TrendAnalysisParams) => Promise<void>;
  clearTrends: () => void;
}

export function useSpendingTrends(): UseSpendingTrendsReturn {
  const [trends, setTrends] = useState<SpendingTrends | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const analyzeTrends = useCallback(async (params: TrendAnalysisParams = {}) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();
      
      const requestBody = {
        timeframe: params.timeframe || '6months',
        analysisType: params.analysisType || 'category',
        categories: params.categories,
        includeProjections: params.includeProjections || false
      };

      const response = await fetch('/api/analytics/spending-trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTrends(data.data);
        logger.info('Spending trends analysis completed successfully', {
          analysisType: data.data.analysisType,
          timeframe: data.data.timeframe,
          trendsCount: data.data.trends.length
        });
      } else {
        throw new Error(data.error || 'Analysis failed');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze spending trends';
      setError(errorMessage);
      logger.error('Error analyzing spending trends', { error: err });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const clearTrends = useCallback(() => {
    setTrends(null);
    setError(null);
  }, []);

  return {
    trends,
    loading,
    error,
    analyzeTrends,
    clearTrends
  };
}

export default useSpendingTrends;