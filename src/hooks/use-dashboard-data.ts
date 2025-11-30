import { useCallback, useMemo } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

import { useSession } from '@/components/providers/SessionProvider';
import { apiGet } from '@/lib/api-client';
import type { Budget, InvestmentAccounts, Liabilities, Overview } from '@/types/finance';

interface DashboardData {
  overview: Overview | null;
  budget: Budget | null;
  investmentAccounts: InvestmentAccounts | null;
  liabilities: Liabilities | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseDashboardDataOptions {
  refetchOnFocus?: boolean;
  refetchInterval?: number;
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

const fetcher = async (url: string): Promise<ApiResponse['data']> => {
  const response = await apiGet(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const result: ApiResponse = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch financial data');
  }
  return result.data;
};

/**
 * Optimized hook for fetching all dashboard data with SWR caching
 */
export function useDashboardData(options: UseDashboardDataOptions = {}): DashboardData {
  const { refetchOnFocus = false, refetchInterval } = options;
  const { firebaseUser } = useSession();

  const swrKey = firebaseUser ? '/api/financial-overview?includePlatforms=false' : null;

  const {
    data: rawData,
    error,
    isLoading,
    mutate,
  } = useSWR(swrKey, fetcher, {
    revalidateOnFocus: refetchOnFocus,
    ...(refetchInterval && { refreshInterval: refetchInterval }),
    dedupingInterval: 60000, // 1 minute deduplication
    errorRetryCount: 2,
    errorRetryInterval: 10000,
    revalidateOnMount: true,
    revalidateIfStale: false,
    // Performance optimizations
    revalidateOnReconnect: true,
    shouldRetryOnError: error => {
      // Don't retry on 4xx errors
      return error.status >= 500;
    },
    // Use stale data while revalidating for better UX
    keepPreviousData: true,
  });

  const transformedData = useMemo(() => {
    if (!rawData) return null;

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
        accounts: (accounts.investment || []).map(acc => ({
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
        ].map(acc => ({
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

  const refetch = useCallback(() => {
    // Force refresh by adding timestamp to bypass cache
    mutate();
    // Also trigger global revalidation for related data
    globalMutate(key => typeof key === 'string' && key.includes('/api/financial'));
    globalMutate(key => typeof key === 'string' && key.includes('/api/overview'));
    globalMutate(key => typeof key === 'string' && key.includes('/api/accounts'));
  }, [mutate]);

  return useMemo(
    () => ({
      overview: transformedData?.overview || null,
      budget: transformedData?.budget || null,
      investmentAccounts: transformedData?.investmentAccounts || null,
      liabilities: transformedData?.liabilities || null,
      loading: isLoading,
      error: error?.message || null,
      refetch,
    }),
    [transformedData, isLoading, error, refetch]
  );
}
