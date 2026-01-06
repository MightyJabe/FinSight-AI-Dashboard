import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import logger from '@/lib/logger';
import type { CryptoAllocation, CryptoCurrency, CryptoPortfolioData } from '@/types/crypto';

interface UseCryptoPortfolioOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  includeHistorical?: boolean;
  currency?: CryptoCurrency;
}

export function useCryptoPortfolio(options: UseCryptoPortfolioOptions = {}) {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    includeHistorical = true,
    currency = 'USD',
  } = options;

  const [data, setData] = useState<CryptoPortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const { firebaseUser } = useSession();

  const fetchPortfolioData = useCallback(async () => {
    if (!firebaseUser) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const idToken = await firebaseUser.getIdToken();
      const params = new URLSearchParams({
        includeHistorical: includeHistorical.toString(),
        includePrices: 'true',
        currency,
      });

      const response = await fetch(`/api/crypto/portfolio?${params}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch crypto portfolio data');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch crypto portfolio data');
      }

      setData(result.data);
      setLastRefresh(new Date());
      logger.info('Crypto portfolio data fetched successfully', {
        holdingsCount: result.data?.holdings?.length || 0,
        totalValue: result.data?.summary?.totalValue || 0,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch crypto portfolio';
      setError(errorMessage);
      logger.error('Error fetching crypto portfolio', { error: err });
    } finally {
      setLoading(false);
    }
  }, [includeHistorical, currency, firebaseUser]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  // Initial fetch
  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchPortfolioData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchPortfolioData]);

  // Helper functions
  const formatCurrency = useCallback(
    (amount: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options,
      }).format(amount);
    },
    [currency]
  );

  const formatCrypto = useCallback((amount: number, decimals = 8) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals,
    }).format(amount);
  }, []);

  const formatPercentage = useCallback((percent: number, showSign = true) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(percent / 100);

    if (showSign && percent > 0) {
      return `+${formatted}`;
    }
    return formatted;
  }, []);

  const getPerformanceColor = useCallback((value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  }, []);

  const getPerformanceIcon = useCallback((value: number) => {
    if (value > 0) return '↗';
    if (value < 0) return '↘';
    return '→';
  }, []);

  const getDiversificationLevel = useCallback((score: number) => {
    if (score >= 70) return { level: 'High', color: 'text-green-600' };
    if (score >= 40) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-red-600' };
  }, []);

  const getTopHoldings = useCallback(
    (count = 5) => {
      if (!data) return [];
      return [...data.holdings].sort((a, b) => b.value - a.value).slice(0, count);
    },
    [data]
  );

  const getTopPerformers = useCallback(
    (count = 5) => {
      if (!data) return [];
      return [...data.holdings]
        .sort((a, b) => b.gainLossPercent - a.gainLossPercent)
        .slice(0, count);
    },
    [data]
  );

  const getBottomPerformers = useCallback(
    (count = 5) => {
      if (!data) return [];
      return [...data.holdings]
        .sort((a, b) => a.gainLossPercent - b.gainLossPercent)
        .slice(0, count);
    },
    [data]
  );

  const getTotalValueTrend = useCallback(() => {
    if (!data || data.historicalData.length < 2) return 0;

    const latest = data.historicalData[data.historicalData.length - 1];
    const previous = data.historicalData[data.historicalData.length - 2];

    if (!latest || !previous) return 0;

    return ((latest.value - previous.value) / previous.value) * 100;
  }, [data]);

  const getPortfolioAllocation = useCallback((): CryptoAllocation[] => {
    if (!data) return [];

    const totalValue = data.summary.totalValue;
    return data.holdings
      .map(holding => ({
        symbol: holding.symbol,
        name: holding.name,
        percentage: totalValue > 0 ? (holding.value / totalValue) * 100 : 0,
        value: holding.value,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [data]);

  const hasData = Boolean(data && data.holdings.length > 0);
  const isPositivePerformance = Boolean(data && data.summary.totalGainLoss >= 0);
  const isDayPositive = Boolean(data && data.summary.dayChange >= 0);

  return useMemo(
    () => ({
      // Data
      data,
      loading,
      error,
      lastRefresh,
      hasData,
      isPositivePerformance,
      isDayPositive,

      // Actions
      refresh,

      // Formatters
      formatCurrency,
      formatCrypto,
      formatPercentage,
      getPerformanceColor,
      getPerformanceIcon,
      getDiversificationLevel,

      // Computed data
      getTopHoldings,
      getTopPerformers,
      getBottomPerformers,
      getTotalValueTrend,
      getPortfolioAllocation,
    }),
    [
      data,
      loading,
      error,
      lastRefresh,
      hasData,
      isPositivePerformance,
      isDayPositive,
      refresh,
      formatCurrency,
      formatCrypto,
      formatPercentage,
      getPerformanceColor,
      getPerformanceIcon,
      getDiversificationLevel,
      getTopHoldings,
      getTopPerformers,
      getBottomPerformers,
      getTotalValueTrend,
      getPortfolioAllocation,
    ]
  );
}
