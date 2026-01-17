/**
 * Real-Time Dashboard Hook
 *
 * Provides real-time dashboard data with visibility-aware polling.
 * Aggregates financial overview, account balances, and key metrics.
 *
 * Features:
 * - 15-second polling for account balances
 * - Visibility-aware (pauses when tab is hidden)
 * - Optimistic updates for instant feedback
 * - Coordinated refresh across related data
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

import { useSession } from '@/components/providers/SessionProvider';
import { apiGet } from '@/lib/api-client';
import { REALTIME_INTERVALS, realtimeSWRConfig } from '@/lib/swr-config';
import type { Budget, InvestmentAccounts, Liabilities, Overview } from '@/types/finance';

export interface UseRealtimeDashboardOptions {
  enabled?: boolean;
  interval?: number;
}

export interface RealtimeDashboardData {
  overview: Overview | null;
  budget: Budget | null;
  investmentAccounts: InvestmentAccounts | null;
  liabilities: Liabilities | null;
}

export interface UseRealtimeDashboardResult {
  data: RealtimeDashboardData;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  lastRefresh: Date | null;
  isStale: boolean;
  // Quick access to key metrics
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyCashFlow: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    summary: {
      liquidAssets: number;
      totalAssets: number;
      totalLiabilities: number;
      netWorth: number;
      monthlyIncome: number;
      monthlyExpenses: number;
      monthlyCashFlow: number;
      budgetCategories?: Array<{ id: string; name: string; amount: number; spent: number }>;
      spendingByCategory?: Array<{ category: string; amount: number }>;
    };
    accounts: {
      bank?: Array<{
        id: string;
        name: string;
        balance: number;
        type: string;
        institution: string;
      }>;
      credit?: Array<{
        id: string;
        name: string;
        balance: number;
        amount: number;
        type: string;
        interestRate?: number;
        minimumPayment?: number;
        remainingPayments?: number;
        payoffDate?: string;
      }>;
      loan?: Array<{
        id: string;
        name: string;
        balance: number;
        amount: number;
        type: string;
        interestRate?: number;
        minimumPayment?: number;
        remainingPayments?: number;
        payoffDate?: string;
      }>;
      investment?: Array<{
        id: string;
        name: string;
        balance: number;
        type: string;
        performance?: { daily: number; monthly: number; yearly: number };
      }>;
    };
    manualAssets?: Array<{ id: string; name: string; amount: number; type: string }>;
    manualLiabilities?: Array<{
      id: string;
      name: string;
      balance: number;
      amount: number;
      type: string;
      interestRate?: number;
      minimumPayment?: number;
      remainingPayments?: number;
      payoffDate?: string;
    }>;
  };
  error?: string;
}

/**
 * Hook for visibility-aware polling
 * Pauses polling when tab is not visible to save resources
 */
function useVisibilityAwareInterval(interval: number): number {
  const [activeInterval, setActiveInterval] = useState(interval);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setActiveInterval(0);
      } else {
        setActiveInterval(interval);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (document.hidden) {
      setActiveInterval(0);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [interval]);

  return activeInterval;
}

const fetcher = async (url: string): Promise<ApiResponse['data']> => {
  const response = await apiGet(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard data: ${response.status}`);
  }
  const result: ApiResponse = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch dashboard data');
  }
  return result.data;
};

/**
 * Real-time dashboard hook with visibility-aware polling
 *
 * @param options.enabled - Whether to enable polling (default: true)
 * @param options.interval - Polling interval in ms (default: 15000)
 */
export function useRealtimeDashboard(
  options: UseRealtimeDashboardOptions = {}
): UseRealtimeDashboardResult {
  const { enabled = true, interval = REALTIME_INTERVALS.ACCOUNT_BALANCES } = options;
  const { firebaseUser } = useSession();

  // Visibility-aware polling
  const activeInterval = useVisibilityAwareInterval(interval);

  const swrKey = firebaseUser && enabled ? '/api/financial-overview?includePlatforms=false' : null;

  const {
    data: rawData,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(swrKey, fetcher, {
    ...realtimeSWRConfig,
    refreshInterval: activeInterval,
  });

  // Track last refresh time
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    if (rawData && !isValidating) {
      setLastRefresh(new Date());
    }
  }, [rawData, isValidating]);

  // Transform raw data to structured format
  const transformedData = useMemo((): RealtimeDashboardData => {
    if (!rawData) {
      return {
        overview: null,
        budget: null,
        investmentAccounts: null,
        liabilities: null,
      };
    }

    const { summary, accounts, manualAssets, manualLiabilities } = rawData;

    return {
      overview: {
        totalBalance: summary.liquidAssets,
        totalAssets: summary.totalAssets,
        totalLiabilities: summary.totalLiabilities,
        netWorth: summary.netWorth,
        monthlyIncome: summary.monthlyIncome,
        monthlyExpenses: summary.monthlyExpenses,
        monthlySavings: summary.monthlyCashFlow,
        accounts: accounts.bank || [],
        manualAssets: manualAssets || [],
        liabilities: [
          ...(accounts.credit || []),
          ...(accounts.loan || []),
          ...(manualLiabilities || []),
        ],
        emergencyFundStatus:
          summary.monthlyExpenses > 0
            ? Math.min(summary.liquidAssets / (summary.monthlyExpenses * 3), 1)
            : 0,
        savingsRate:
          summary.monthlyIncome > 0 ? summary.monthlyCashFlow / summary.monthlyIncome : 0,
      } as Overview,
      budget: {
        monthlyExpenses: summary.monthlyExpenses,
        budgetCategories: summary.budgetCategories || [],
        spendingByCategory: summary.spendingByCategory || [],
      } as Budget,
      investmentAccounts: {
        accounts: (accounts.investment || []).map((acc) => ({
          id: acc.id,
          name: acc.name,
          balance: acc.balance,
          type: acc.type,
          performance: acc.performance ?? { daily: 0, monthly: 0, yearly: 0 },
        })),
      } as InvestmentAccounts,
      liabilities: {
        accounts: [
          ...(accounts.credit || []),
          ...(accounts.loan || []),
          ...(manualLiabilities || []),
        ].map((acc) => ({
          id: acc.id,
          name: acc.name,
          amount: Math.abs(acc.balance || acc.amount || 0),
          type: acc.type,
          interestRate: acc.interestRate,
          minimumPayment: acc.minimumPayment,
          remainingPayments: acc.remainingPayments,
          payoffDate: acc.payoffDate,
        })),
        totalDebt: summary.totalLiabilities,
      } as Liabilities,
    };
  }, [rawData]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await mutate();
    // Trigger coordinated refresh across all financial data
    globalMutate((key) => typeof key === 'string' && key.includes('/api/financial'));
    globalMutate((key) => typeof key === 'string' && key.includes('/api/accounts'));
    globalMutate((key) => typeof key === 'string' && key.includes('/api/net-worth'));
    setLastRefresh(new Date());
  }, [mutate]);

  // Determine if data is stale
  const isStale = useMemo(() => {
    if (!lastRefresh) return false;
    const staleThreshold = interval * 2;
    return Date.now() - lastRefresh.getTime() > staleThreshold;
  }, [lastRefresh, interval]);

  // Quick access to key metrics
  const netWorth = rawData?.summary?.netWorth ?? 0;
  const totalAssets = rawData?.summary?.totalAssets ?? 0;
  const totalLiabilities = rawData?.summary?.totalLiabilities ?? 0;
  const monthlyCashFlow = rawData?.summary?.monthlyCashFlow ?? 0;

  return {
    data: transformedData,
    isLoading,
    isValidating,
    error: error || null,
    refresh,
    lastRefresh,
    isStale,
    netWorth,
    totalAssets,
    totalLiabilities,
    monthlyCashFlow,
  };
}

/**
 * Hook for optimistic dashboard updates
 */
export function useRealtimeDashboardOptimistic() {
  const { firebaseUser } = useSession();
  const swrKey = firebaseUser ? '/api/financial-overview' : null;

  const optimisticUpdate = useCallback(
    async (updater: (current: ApiResponse['data']) => ApiResponse['data']) => {
      if (!swrKey) return;

      await globalMutate(
        (key) => typeof key === 'string' && key.includes('/api/financial-overview'),
        (current: ApiResponse['data'] | undefined) => {
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

export default useRealtimeDashboard;
