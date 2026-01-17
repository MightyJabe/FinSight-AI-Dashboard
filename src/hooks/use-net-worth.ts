/**
 * Real-Time Net Worth Hook
 *
 * Provides real-time net worth tracking with aggressive SWR polling.
 * Optimized for Vercel serverless (no WebSocket needed).
 *
 * Features:
 * - 10-second polling for real-time feel
 * - Visibility-aware (pauses when tab is hidden)
 * - Optimistic updates for instant feedback
 * - Trend calculation (daily/weekly/monthly changes)
 * - Easy migration path to WebSocket/SSE later
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

import { useSession } from '@/components/providers/SessionProvider';
import { apiGet } from '@/lib/api-client';
import { REALTIME_INTERVALS, realtimeSWRConfig } from '@/lib/swr-config';

export interface NetWorthData {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  liquidAssets: number;
  investments: number;
  cryptoBalance: number;
  realEstate: number;
  pension: number;
  lastUpdated: Date;
}

export interface NetWorthTrend {
  daily: number;
  weekly: number;
  monthly: number;
  dailyPercent: number;
  weeklyPercent: number;
  monthlyPercent: number;
}

export interface UseNetWorthResult {
  data: NetWorthData | null;
  trend: NetWorthTrend | null;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  lastRefresh: Date | null;
  isStale: boolean;
}

interface NetWorthApiResponse {
  success: boolean;
  data: {
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    liquidAssets: number;
    investments: number;
    cryptoBalance?: number;
    realEstate?: number;
    pension?: number;
    trend?: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  };
  error?: string;
}

const fetcher = async (url: string): Promise<NetWorthApiResponse['data']> => {
  const response = await apiGet(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch net worth: ${response.status}`);
  }
  const result: NetWorthApiResponse = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch net worth');
  }
  return result.data;
};

/**
 * Hook for visibility-aware polling
 * Pauses polling when tab is not visible to save resources
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

/**
 * Real-time net worth hook with aggressive polling
 *
 * @param options.enabled - Whether to enable polling (default: true)
 * @param options.interval - Polling interval in ms (default: 10000)
 */
export function useNetWorth(
  options: {
    enabled?: boolean;
    interval?: number;
  } = {}
): UseNetWorthResult {
  const { enabled = true, interval = REALTIME_INTERVALS.NET_WORTH } = options;
  const { firebaseUser } = useSession();

  // Visibility-aware polling - pauses when tab is hidden
  const activeInterval = useVisibilityAwareInterval(interval);

  const swrKey = firebaseUser && enabled ? '/api/net-worth' : null;

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

  // Transform raw data to NetWorthData
  const data: NetWorthData | null = useMemo(() => {
    if (!rawData) return null;

    return {
      netWorth: rawData.netWorth,
      totalAssets: rawData.totalAssets,
      totalLiabilities: rawData.totalLiabilities,
      liquidAssets: rawData.liquidAssets,
      investments: rawData.investments,
      cryptoBalance: rawData.cryptoBalance ?? 0,
      realEstate: rawData.realEstate ?? 0,
      pension: rawData.pension ?? 0,
      lastUpdated: new Date(),
    };
  }, [rawData]);

  // Calculate trends
  const trend: NetWorthTrend | null = useMemo(() => {
    if (!rawData?.trend || !rawData.netWorth) return null;

    const { daily, weekly, monthly } = rawData.trend;
    const netWorth = rawData.netWorth;

    // Avoid division by zero
    const previousDaily = netWorth - daily;
    const previousWeekly = netWorth - weekly;
    const previousMonthly = netWorth - monthly;

    return {
      daily,
      weekly,
      monthly,
      dailyPercent: previousDaily !== 0 ? (daily / previousDaily) * 100 : 0,
      weeklyPercent: previousWeekly !== 0 ? (weekly / previousWeekly) * 100 : 0,
      monthlyPercent: previousMonthly !== 0 ? (monthly / previousMonthly) * 100 : 0,
    };
  }, [rawData]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await mutate();
    // Also trigger related data refresh
    globalMutate((key) => typeof key === 'string' && key.includes('/api/financial'));
    globalMutate((key) => typeof key === 'string' && key.includes('/api/accounts'));
    setLastRefresh(new Date());
  }, [mutate]);

  // Determine if data is stale (older than 2x the interval)
  const isStale = useMemo(() => {
    if (!lastRefresh) return false;
    const staleThreshold = interval * 2;
    return Date.now() - lastRefresh.getTime() > staleThreshold;
  }, [lastRefresh, interval]);

  return {
    data,
    trend,
    isLoading,
    isValidating,
    error: error || null,
    refresh,
    lastRefresh,
    isStale,
  };
}

/**
 * Hook for optimistic net worth updates
 * Use when user performs actions that will change net worth
 *
 * @example
 * const { optimisticUpdate } = useNetWorthOptimistic();
 * // User adds a new asset
 * optimisticUpdate((current) => ({
 *   ...current,
 *   totalAssets: current.totalAssets + newAssetValue,
 *   netWorth: current.netWorth + newAssetValue,
 * }));
 */
export function useNetWorthOptimistic() {
  const { firebaseUser } = useSession();
  const swrKey = firebaseUser ? '/api/net-worth' : null;

  const optimisticUpdate = useCallback(
    async (
      updater: (current: NetWorthApiResponse['data']) => NetWorthApiResponse['data']
    ) => {
      if (!swrKey) return;

      await globalMutate(
        swrKey,
        (current: NetWorthApiResponse['data'] | undefined) => {
          if (!current) return current;
          return updater(current);
        },
        {
          revalidate: true, // Still fetch fresh data after optimistic update
          rollbackOnError: true, // Rollback if server request fails
        }
      );
    },
    [swrKey]
  );

  return { optimisticUpdate };
}

export default useNetWorth;
