import { useCallback, useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import logger from '@/lib/logger';

interface ManualOverride {
  transactionId: string;
  newCategory: string;
  reason?: string;
}

interface OverrideResult {
  transactionId: string;
  success: boolean;
  error?: string;
}

interface OverrideHistory {
  transactionId: string;
  manualCategory: string;
  originalAiCategory: string;
  manualOverrideReason: string;
  manualOverrideAt: string;
  description: string;
  amount: number;
  date: string;
}

export function useManualCategorization() {
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

  const overrideCategory = useCallback(
    async (transactionId: string, newCategory: string, reason?: string): Promise<boolean> => {
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const headers = await getAuthHeaders();

        const response = await fetch('/api/transactions/categorize-override', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            transactionId,
            newCategory,
            reason,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to override category');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Override failed');
        }

        const result = data.data.results[0];
        if (!result.success) {
          throw new Error(result.error || 'Override failed');
        }

        logger.info('Manual category override successful', {
          transactionId,
          newCategory,
          reason,
        });

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        logger.error('Error overriding category', { error: err, transactionId });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user, getAuthHeaders]
  );

  const bulkOverrideCategories = useCallback(
    async (
      overrides: ManualOverride[]
    ): Promise<{ successful: number; failed: number; results: OverrideResult[] }> => {
      if (!user) {
        setError('User not authenticated');
        return { successful: 0, failed: 0, results: [] };
      }

      setIsLoading(true);
      setError(null);

      try {
        const headers = await getAuthHeaders();

        const response = await fetch('/api/transactions/categorize-override', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            overrides,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to override categories');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Bulk override failed');
        }

        logger.info('Bulk manual category override completed', {
          summary: data.data.summary,
        });

        return {
          successful: data.data.summary.successful,
          failed: data.data.summary.failed,
          results: data.data.results,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        logger.error('Error in bulk category override', { error: err });
        return { successful: 0, failed: 0, results: [] };
      } finally {
        setIsLoading(false);
      }
    },
    [user, getAuthHeaders]
  );

  const getOverrideHistory = useCallback(
    async (transactionId?: string): Promise<OverrideHistory[] | null> => {
      if (!user) {
        setError('User not authenticated');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const headers = await getAuthHeaders();

        const url = transactionId
          ? `/api/transactions/categorize-override?transactionId=${transactionId}`
          : '/api/transactions/categorize-override';

        const response = await fetch(url, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get override history');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to get history');
        }

        if (transactionId) {
          // Single transaction override data
          return data.data.hasManualOverride ? [data.data] : [];
        } else {
          // All overrides for the user
          return data.data.overrides;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        logger.error('Error fetching override history', { error: err });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user, getAuthHeaders]
  );

  const checkTransactionOverride = useCallback(
    async (
      transactionId: string
    ): Promise<{
      hasOverride: boolean;
      manualCategory?: string;
      originalCategory?: string;
      reason?: string;
      overrideDate?: string;
    } | null> => {
      if (!user) {
        setError('User not authenticated');
        return null;
      }

      try {
        const headers = await getAuthHeaders();

        const response = await fetch(
          `/api/transactions/categorize-override?transactionId=${transactionId}`,
          {
            method: 'GET',
            headers,
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            return { hasOverride: false };
          }
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to check override');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to check override');
        }

        return {
          hasOverride: data.data.hasManualOverride,
          manualCategory: data.data.manualCategory,
          originalCategory: data.data.originalAiCategory,
          reason: data.data.manualOverrideReason,
          overrideDate: data.data.manualOverrideAt,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        logger.error('Error checking transaction override', { error: err, transactionId });
        return null;
      }
    },
    [user, getAuthHeaders]
  );

  return {
    overrideCategory,
    bulkOverrideCategories,
    getOverrideHistory,
    checkTransactionOverride,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
