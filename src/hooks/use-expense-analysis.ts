import { useCallback, useState } from 'react';
import useSWR from 'swr';

import { useSession } from '@/components/providers/SessionProvider';
import type { ExpenseAnalysis } from '@/lib/services/expense-optimizer';

interface ExpenseAnalysisResponse {
  success: boolean;
  data: ExpenseAnalysis;
  meta: {
    months: number;
    transactionCount: number;
    monthlyIncome: number;
    savingsGoalPercent: number;
  };
}

interface UseExpenseAnalysisOptions {
  months?: number;
  savingsGoalPercent?: number;
}

export function useExpenseAnalysis(options: UseExpenseAnalysisOptions = {}) {
  const { firebaseUser } = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const months = options.months || 3;
  const savingsGoalPercent = options.savingsGoalPercent || 20;

  const fetcher = useCallback(
    async (url: string) => {
      if (!firebaseUser) throw new Error('No auth');
      const token = await firebaseUser.getIdToken();
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.json();
    },
    [firebaseUser]
  );

  const swrKey = firebaseUser
    ? `/api/expenses/analysis?months=${months}&savingsGoalPercent=${savingsGoalPercent}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<ExpenseAnalysisResponse>(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await mutate();
    } finally {
      setIsRefreshing(false);
    }
  }, [mutate]);

  return {
    analysis: data?.data ?? null,
    meta: data?.meta ?? null,
    isLoading,
    isRefreshing,
    error: error?.message ?? null,
    refresh,
  };
}
