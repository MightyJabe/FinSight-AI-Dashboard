import { useCallback, useEffect, useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import type { Budget, InvestmentAccounts, Liabilities, Overview } from '@/lib/finance';

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

/**
 * Optimized hook for fetching all dashboard data with caching and error handling
 */
export function useDashboardData(options: UseDashboardDataOptions = {}): DashboardData {
  const { refetchOnFocus = false, refetchInterval } = options;
  const { firebaseUser } = useSession();

  const [data, setData] = useState<DashboardData>({
    overview: null,
    budget: null,
    investmentAccounts: null,
    liabilities: null,
    loading: true,
    error: null,
    refetch: () => {},
  });

  const [lastFetch, setLastFetch] = useState<number>(0);
  const [cacheKey, setCacheKey] = useState<string>('');

  // Generate cache key based on user session
  useEffect(() => {
    const generateCacheKey = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const session = await response.json();
          setCacheKey(session.user?.uid || 'anonymous');
        }
      } catch (error) {
        console.warn('Failed to get session for cache key:', error);
        setCacheKey('anonymous');
      }
    };

    generateCacheKey();
  }, []);

  const fetchData = useCallback(async () => {
    if (!cacheKey || !firebaseUser) return;

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Get auth token for authenticated requests
      const token = await firebaseUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all data from single consolidated endpoint
      const response = await fetch(
        '/api/financial-overview?includeTransactions=false&includePlatforms=true',
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch financial data');
      }

      const financialData = result.data;
      const summary = financialData.summary;

      // Transform the consolidated data into the expected dashboard format
      const newData: Partial<DashboardData> = {
        overview: {
          totalBalance: summary.liquidAssets,
          totalAssets: summary.totalAssets,
          totalLiabilities: summary.totalLiabilities,
          netWorth: summary.netWorth,
          monthlyIncome: summary.monthlyIncome,
          monthlyExpenses: summary.monthlyExpenses,
          accounts: financialData.accounts.bank || [],
          manualAssets: financialData.manualAssets || [],
          manualLiabilities: financialData.manualLiabilities?.length || 0,
          liabilities: [
            ...(financialData.accounts.credit || []),
            ...(financialData.accounts.loan || []),
            ...(financialData.manualLiabilities || []),
          ],
          emergencyFundStatus: 0, // Will be calculated
          savingsRate:
            summary.monthlyIncome > 0 ? summary.monthlyCashFlow / summary.monthlyIncome : 0,
        },
        budget: {
          monthlyExpenses: summary.monthlyExpenses,
          budgetCategories: [], // Will be calculated from transactions if needed
          spendingByCategory: [], // Will be calculated from transactions if needed
          totalCategories: 0,
        },
        investmentAccounts: {
          accounts: [
            ...(financialData.accounts.investment || []),
            ...(financialData.platforms || []),
          ],
          totalValue: summary.investments,
          totalInvestmentValue: summary.investments,
          totalManualInvestments:
            financialData.platforms?.reduce(
              (sum: number, p: any) => sum + (p.currentBalance || 0),
              0
            ) || 0,
          accountCount:
            (financialData.accounts.investment?.length || 0) +
            (financialData.platforms?.length || 0),
          performance: {
            monthlyGain: summary.investments * 0.02, // Mock data
            yearToDate: summary.investments * 0.08,
            allTimeGain: summary.investments * 0.15,
          },
        },
        liabilities: {
          accounts: [
            ...(financialData.accounts.credit || []),
            ...(financialData.accounts.loan || []),
            ...(financialData.manualLiabilities || []),
          ],
          totalDebt: summary.totalLiabilities,
          creditAccounts: financialData.accounts.credit?.length || 0,
          manualLiabilities: financialData.manualLiabilities?.length || 0,
          totalCreditDebt:
            financialData.accounts.credit?.reduce(
              (sum: number, acc: any) => sum + Math.abs(acc.balance || 0),
              0
            ) || 0,
          totalManualDebt:
            financialData.manualLiabilities?.reduce(
              (sum: number, l: any) => sum + (l.amount || 0),
              0
            ) || 0,
        },
      };

      setData(prev => ({
        ...prev,
        ...newData,
        loading: false,
        error: null,
      }));

      setLastFetch(Date.now());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data',
      }));
    }
  }, [cacheKey, firebaseUser]);

  // Initial data fetch
  useEffect(() => {
    if (cacheKey && firebaseUser) {
      fetchData();
    }
  }, [fetchData, cacheKey, firebaseUser]);

  // Refetch on focus (if enabled)
  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleFocus = () => {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetch;
      // Only refetch if it's been more than 5 minutes since last fetch
      if (timeSinceLastFetch > 5 * 60 * 1000) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData, lastFetch, refetchOnFocus]);

  // Refetch interval (if enabled)
  useEffect(() => {
    if (!refetchInterval) return;

    const interval = setInterval(fetchData, refetchInterval);
    return () => clearInterval(interval);
  }, [fetchData, refetchInterval]);

  // Manual refetch function
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...data,
    refetch,
  };
}
