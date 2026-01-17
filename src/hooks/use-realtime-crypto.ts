/**
 * Real-Time Crypto Portfolio Hook
 *
 * Provides real-time crypto price updates with visibility-aware polling.
 * Optimized for Vercel serverless (no WebSocket needed).
 *
 * Features:
 * - 30-second polling for crypto prices (respecting API rate limits)
 * - Visibility-aware (pauses when tab is hidden)
 * - Optimistic updates for instant feedback
 * - SWR caching for better performance
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

import { useSession } from '@/components/providers/SessionProvider';
import { apiGet } from '@/lib/api-client';
import { REALTIME_INTERVALS, realtimeSWRConfig } from '@/lib/swr-config';
import type { CryptoPortfolioData } from '@/types/crypto';

export interface UseRealtimeCryptoOptions {
  enabled?: boolean;
  interval?: number;
  currency?: 'USD' | 'ILS' | 'EUR';
  includeHistorical?: boolean;
}

export interface UseRealtimeCryptoResult {
  data: CryptoPortfolioData | null;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  lastRefresh: Date | null;
  isStale: boolean;
  // Computed values
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  isPositive: boolean;
}

interface CryptoApiResponse {
  success: boolean;
  data: CryptoPortfolioData;
  error?: string;
}

/**
 * Hook for visibility-aware polling
 * Pauses polling when tab is not visible to save resources and API quota
 */
function useVisibilityAwareInterval(interval: number): number {
  const [activeInterval, setActiveInterval] = useState(interval);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - pause polling (set to 0 to disable)
        setActiveInterval(0);
      } else {
        // Tab is visible - resume polling
        setActiveInterval(interval);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set initial state based on current visibility
    if (document.hidden) {
      setActiveInterval(0);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [interval]);

  return activeInterval;
}

const fetcher = async (url: string): Promise<CryptoPortfolioData> => {
  const response = await apiGet(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch crypto portfolio: ${response.status}`);
  }
  const result: CryptoApiResponse = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch crypto portfolio');
  }
  return result.data;
};

/**
 * Real-time crypto portfolio hook with visibility-aware polling
 *
 * @param options.enabled - Whether to enable polling (default: true)
 * @param options.interval - Polling interval in ms (default: 30000)
 * @param options.currency - Display currency (default: 'USD')
 * @param options.includeHistorical - Include historical data (default: false)
 */
export function useRealtimeCrypto(
  options: UseRealtimeCryptoOptions = {}
): UseRealtimeCryptoResult {
  const {
    enabled = true,
    interval = REALTIME_INTERVALS.CRYPTO_PRICES,
    currency = 'USD',
    includeHistorical = false,
  } = options;

  const { firebaseUser } = useSession();

  // Visibility-aware polling - pauses when tab is hidden
  const activeInterval = useVisibilityAwareInterval(interval);

  // Build query params
  const queryParams = new URLSearchParams({
    currency,
    includeHistorical: includeHistorical.toString(),
    includePrices: 'true',
  });

  const swrKey = firebaseUser && enabled ? `/api/crypto/portfolio?${queryParams}` : null;

  const {
    data: rawData,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(swrKey, fetcher, {
    ...realtimeSWRConfig,
    refreshInterval: activeInterval, // Use visibility-aware interval
  });

  // Track last refresh time
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Update last refresh when data changes
  useEffect(() => {
    if (rawData && !isValidating) {
      setLastRefresh(new Date());
    }
  }, [rawData, isValidating]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await mutate();
    // Also trigger related data refresh
    globalMutate((key) => typeof key === 'string' && key.includes('/api/crypto'));
    setLastRefresh(new Date());
  }, [mutate]);

  // Determine if data is stale (older than 2x the interval)
  const isStale = useMemo(() => {
    if (!lastRefresh) return false;
    const staleThreshold = interval * 2;
    return Date.now() - lastRefresh.getTime() > staleThreshold;
  }, [lastRefresh, interval]);

  // Computed values
  const totalValue = rawData?.summary?.totalValue ?? 0;
  const dayChange = rawData?.summary?.dayChange ?? 0;
  const dayChangePercent = rawData?.summary?.dayChangePercent ?? 0;
  const isPositive = dayChange >= 0;

  return {
    data: rawData ?? null,
    isLoading,
    isValidating,
    error: error || null,
    refresh,
    lastRefresh,
    isStale,
    totalValue,
    dayChange,
    dayChangePercent,
    isPositive,
  };
}

/**
 * Hook for optimistic crypto updates
 * Use when user performs actions that will change crypto portfolio
 */
export function useRealtimeCryptoOptimistic() {
  const { firebaseUser } = useSession();
  const swrKey = firebaseUser ? '/api/crypto/portfolio' : null;

  const optimisticUpdate = useCallback(
    async (updater: (current: CryptoPortfolioData) => CryptoPortfolioData) => {
      if (!swrKey) return;

      await globalMutate(
        (key) => typeof key === 'string' && key.includes('/api/crypto/portfolio'),
        (current: CryptoPortfolioData | undefined) => {
          if (!current) return current;
          return updater(current);
        },
        {
          revalidate: true,
          rollbackOnError: true,
        }
      );
    },
    [swrKey]
  );

  return { optimisticUpdate };
}

export default useRealtimeCrypto;
