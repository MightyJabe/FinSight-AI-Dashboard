import useSWR from 'swr';

import { useSession } from '@/components/providers/SessionProvider';
import { ApiError, apiGet } from '@/lib/api-client';

const fetcher = async (url: string) => {
  try {
    const res = await apiGet(url);
    return res.json();
  } catch (err) {
    if (err instanceof ApiError && err.status === 402) {
      return { insights: [], proRequired: true };
    }
    throw err;
  }
};

export function useProactiveInsights() {
  const { firebaseUser } = useSession();
  const swrKey = firebaseUser ? '/api/insights/proactive' : null;

  const { data, error, isLoading, mutate } = useSWR(swrKey, fetcher);

  return {
    insights: data?.insights || [],
    isLoading,
    proRequired: Boolean(data?.proRequired),
    error,
    refresh: mutate,
  };
}
