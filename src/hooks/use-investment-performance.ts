import { useCallback, useEffect, useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import logger from '@/lib/logger';

export interface InvestmentHolding {
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  value: number;
  costBasis?: number;
  gainLoss?: number;
  gainLossPercent?: number;
  type: 'stock' | 'bond' | 'etf' | 'mutual_fund' | 'crypto' | 'other';
  sector?: string;
}

export interface PerformanceMetrics {
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  yearlyReturn: number;
  volatility: number;
  sharpeRatio: number;
}

export interface AssetAllocation {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PerformanceData {
  date: string;
  value: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface AccountPerformance {
  id: string;
  name: string;
  type: string;
  balance: number;
  performance: {
    daily: number;
    monthly: number;
    yearly: number;
    risk: 'Low' | 'Medium' | 'High';
    trend: 'up' | 'down' | 'stable';
  };
}

export interface InvestmentPerformanceData {
  summary: {
    totalAccounts: number;
    totalValue: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    lastUpdated: string;
  };
  performance: PerformanceMetrics;
  holdings: InvestmentHolding[];
  assetAllocation: AssetAllocation[];
  sectorAllocation: AssetAllocation[];
  accountPerformance: AccountPerformance[];
  historicalData: PerformanceData[];
  insights: string[];
}

type TimePeriod = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface UseInvestmentPerformanceOptions {
  period?: TimePeriod;
  includeAssetAllocation?: boolean;
  includeHistorical?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useInvestmentPerformance(options: UseInvestmentPerformanceOptions = {}) {
  const {
    period = '1M',
    includeAssetAllocation = true,
    includeHistorical = true,
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes
  } = options;

  const { firebaseUser } = useSession();
  const [data, setData] = useState<InvestmentPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(period);

  const getAuthHeaders = useCallback(async () => {
    if (!firebaseUser) throw new Error('User not authenticated');
    const token = await firebaseUser.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, [firebaseUser]);

  const fetchPerformanceData = useCallback(
    async (timePeriod: TimePeriod = selectedPeriod) => {
      if (!firebaseUser) return;

      try {
        setLoading(true);
        setError(null);

        const headers = await getAuthHeaders();
        const queryParams = new URLSearchParams({
          period: timePeriod,
          includeAssetAllocation: includeAssetAllocation.toString(),
          includeHistorical: includeHistorical.toString(),
        });

        const response = await fetch(`/api/investment-performance?${queryParams}`, {
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch investment performance');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to load performance data');
        }

        setData(result.data);
        logger.info('Investment performance data loaded', {
          period: timePeriod,
          totalValue: result.data.summary.totalValue,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load investment performance';
        setError(errorMessage);
        logger.error('Error fetching investment performance', { error: err, period: timePeriod });
      } finally {
        setLoading(false);
      }
    },
    [firebaseUser, getAuthHeaders, selectedPeriod, includeAssetAllocation, includeHistorical]
  );

  const changePeriod = useCallback(
    (newPeriod: TimePeriod) => {
      setSelectedPeriod(newPeriod);
      fetchPerformanceData(newPeriod);
    },
    [fetchPerformanceData]
  );

  const refresh = useCallback(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  // Initial data fetch
  useEffect(() => {
    if (firebaseUser) {
      fetchPerformanceData();
    }
  }, [fetchPerformanceData, firebaseUser]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !firebaseUser) return;

    const interval = setInterval(() => {
      fetchPerformanceData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchPerformanceData, firebaseUser]);

  // Derived data and helpers
  const getPerformanceColor = useCallback((value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  }, []);

  const formatPerformance = useCallback((value: number, isPercentage = true) => {
    const formatted = isPercentage
      ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
      : `${value >= 0 ? '+' : ''}$${Math.abs(value).toLocaleString()}`;
    return formatted;
  }, []);

  const getRiskBadgeColor = useCallback((risk: 'Low' | 'Medium' | 'High') => {
    switch (risk) {
      case 'Low':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getTopPerformers = useCallback(
    (count = 5) => {
      if (!data?.holdings) return [];
      return [...data.holdings]
        .filter(holding => holding.gainLossPercent !== undefined)
        .sort((a, b) => (b.gainLossPercent || 0) - (a.gainLossPercent || 0))
        .slice(0, count);
    },
    [data]
  );

  const getBottomPerformers = useCallback(
    (count = 5) => {
      if (!data?.holdings) return [];
      return [...data.holdings]
        .filter(holding => holding.gainLossPercent !== undefined)
        .sort((a, b) => (a.gainLossPercent || 0) - (b.gainLossPercent || 0))
        .slice(0, count);
    },
    [data]
  );

  const getTotalPortfolioValue = useCallback(() => {
    return data?.summary.totalValue || 0;
  }, [data]);

  const getDiversificationScore = useCallback(() => {
    if (!data?.assetAllocation) return 0;

    // Calculate Herfindahl-Hirschman Index for diversification
    const hhi = data.assetAllocation.reduce((sum, allocation) => {
      const share = allocation.percentage / 100;
      return sum + share * share;
    }, 0);

    // Convert to diversification score (0-100, higher is more diversified)
    return Math.max(0, (1 - hhi) * 100);
  }, [data]);

  const getPerformanceGrade = useCallback(() => {
    if (!data?.performance) return 'N/A';

    const yearlyReturn = data.performance.yearlyReturn;
    if (yearlyReturn >= 15) return 'A+';
    if (yearlyReturn >= 10) return 'A';
    if (yearlyReturn >= 7) return 'B+';
    if (yearlyReturn >= 5) return 'B';
    if (yearlyReturn >= 0) return 'C';
    return 'D';
  }, [data]);

  return {
    // Data
    data,
    loading,
    error,
    selectedPeriod,

    // Actions
    changePeriod,
    refresh,
    setError: (error: string | null) => setError(error),

    // Helpers
    getPerformanceColor,
    formatPerformance,
    getRiskBadgeColor,
    getTopPerformers,
    getBottomPerformers,
    getTotalPortfolioValue,
    getDiversificationScore,
    getPerformanceGrade,

    // Computed values
    hasData: !!data && data.holdings.length > 0,
    isPositivePerformance: (data?.performance.totalGainLoss || 0) > 0,
    diversificationScore: getDiversificationScore(),
    performanceGrade: getPerformanceGrade(),
  };
}
