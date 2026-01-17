import { useCallback, useState } from 'react';
import useSWR from 'swr';

import { useSession } from '@/components/providers/SessionProvider';
import type { Subscription, SubscriptionSummary } from '@/types/subscription';

interface SubscriptionsResponse {
  success: boolean;
  subscriptions: Subscription[];
  summary: SubscriptionSummary;
  error?: string;
}

interface UseSubscriptionsReturn {
  subscriptions: Subscription[];
  summary: SubscriptionSummary;
  isLoading: boolean;
  isDetecting: boolean;
  error: string | null;
  detectSubscriptions: () => Promise<void>;
  refresh: () => Promise<void>;
  cancelSubscription: (id: string) => Promise<void>;
}

const defaultSummary: SubscriptionSummary = {
  totalMonthly: 0,
  totalYearly: 0,
  activeCount: 0,
  categories: {},
};

async function fetchSubscriptions(url: string, token: string): Promise<SubscriptionsResponse> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export function useSubscriptions(): UseSubscriptionsReturn {
  const { firebaseUser } = useSession();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    if (!firebaseUser) return null;
    return firebaseUser.getIdToken();
  }, [firebaseUser]);

  const { data, error, isLoading, mutate: revalidate } = useSWR(
    firebaseUser ? '/api/subscriptions/detect' : null,
    async (url) => {
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      return fetchSubscriptions(url, token);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
    }
  );

  const detectSubscriptions = useCallback(async () => {
    if (!firebaseUser) return;
    setIsDetecting(true);
    setDetectError(null);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/subscriptions/detect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        await revalidate();
      } else {
        setDetectError(result.error || 'Failed to detect subscriptions');
      }
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : 'Detection failed');
    } finally {
      setIsDetecting(false);
    }
  }, [firebaseUser, revalidate]);

  const refresh = useCallback(async () => {
    await revalidate();
  }, [revalidate]);

  const cancelSubscription = useCallback(async (id: string) => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/subscriptions/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await revalidate();
      }
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
    }
  }, [firebaseUser, revalidate]);

  // Calculate categories from subscriptions
  const subscriptions = data?.subscriptions ?? [];
  const categories: Record<string, number> = {};
  subscriptions.forEach(sub => {
    if (sub.status === 'active') {
      categories[sub.category] = (categories[sub.category] || 0) + sub.amount;
    }
  });

  return {
    subscriptions,
    summary: data?.summary
      ? { ...data.summary, categories }
      : { ...defaultSummary, categories },
    isLoading,
    isDetecting,
    error: error?.message || detectError,
    detectSubscriptions,
    refresh,
    cancelSubscription,
  };
}
