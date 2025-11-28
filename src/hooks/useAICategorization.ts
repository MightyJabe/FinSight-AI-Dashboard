import { useCallback, useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import { CategorizedTransaction } from '@/lib/ai-categorization';
import logger from '@/lib/logger';

interface CategorizationStatus {
  total: number;
  categorized: number;
  uncategorized: number;
  percentage: number;
}

interface CategorizationResult {
  categorizedTransactions: CategorizedTransaction[];
  summary: {
    total: number;
    categorized: number;
    failed: number;
  };
}

export function useAICategorization() {
  const { firebaseUser: user } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    const token = await user.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, [user]);

  const categorizeTransactions = useCallback(
    async (
      transactions?: Array<{
        id: string;
        amount: number;
        description: string;
        date: string;
        originalCategory?: string[] | undefined;
        merchant_name?: string | undefined;
        payment_channel?: string | undefined;
      }>,
      options?: {
        accountId?: string;
        startDate?: string;
        endDate?: string;
      }
    ): Promise<CategorizationResult | null> => {
      if (!user) {
        setError('User not authenticated');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const headers = await getAuthHeaders();

        const response = await fetch('/api/transactions/categorize', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            transactions,
            ...options,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to categorize transactions');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Categorization failed');
        }

        logger.info('AI categorization completed', {
          summary: data.data.summary,
        });

        return data.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        logger.error('Error categorizing transactions', { error: err });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user, getAuthHeaders]
  );

  const getCategorizationStatus = useCallback(async (): Promise<CategorizationStatus | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();

      const response = await fetch('/api/transactions/categorize', {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get categorization status');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get status');
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Error fetching categorization status', { error: err });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, getAuthHeaders]);

  const categorizeAllTransactions = useCallback(
    async (options?: {
      startDate?: string;
      endDate?: string;
    }): Promise<CategorizationResult | null> => {
      return categorizeTransactions(undefined, options);
    },
    [categorizeTransactions]
  );

  const categorizeAccountTransactions = useCallback(
    async (
      accountId: string,
      options?: {
        startDate?: string;
        endDate?: string;
      }
    ): Promise<CategorizationResult | null> => {
      return categorizeTransactions(undefined, { accountId, ...options });
    },
    [categorizeTransactions]
  );

  return {
    categorizeTransactions,
    categorizeAllTransactions,
    categorizeAccountTransactions,
    getCategorizationStatus,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
