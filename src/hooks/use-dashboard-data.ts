import { useCallback, useEffect, useState } from 'react';

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
    if (!cacheKey) return;

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch all data in parallel for better performance
      const [overviewRes, budgetRes, investmentRes, liabilitiesRes] = await Promise.allSettled([
        fetch('/api/accounts'),
        fetch('/api/budget'),
        fetch('/api/investment-accounts'),
        fetch('/api/liabilities'),
      ]);

      const newData: Partial<DashboardData> = {};

      // Handle overview data
      if (overviewRes.status === 'fulfilled' && overviewRes.value.ok) {
        const overviewData = await overviewRes.value.json();
        newData.overview = overviewData;
      } else {
        throw new Error('Failed to fetch overview data');
      }

      // Handle budget data
      if (budgetRes.status === 'fulfilled' && budgetRes.value.ok) {
        const budgetData = await budgetRes.value.json();
        newData.budget = budgetData;
      } else {
        console.warn('Failed to fetch budget data, using fallback');
        newData.budget = { monthlyExpenses: 0, budgetCategories: [], spendingByCategory: [] };
      }

      // Handle investment accounts data
      if (investmentRes.status === 'fulfilled' && investmentRes.value.ok) {
        const investmentData = await investmentRes.value.json();
        newData.investmentAccounts = investmentData;
      } else {
        console.warn('Failed to fetch investment data, using fallback');
        newData.investmentAccounts = { accounts: [] };
      }

      // Handle liabilities data
      if (liabilitiesRes.status === 'fulfilled' && liabilitiesRes.value.ok) {
        const liabilitiesData = await liabilitiesRes.value.json();
        newData.liabilities = liabilitiesData;
      } else {
        console.warn('Failed to fetch liabilities data, using fallback');
        newData.liabilities = { accounts: [], totalDebt: 0 };
      }

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
  }, [cacheKey]);

  // Initial data fetch
  useEffect(() => {
    if (cacheKey) {
      fetchData();
    }
  }, [fetchData, cacheKey]);

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
