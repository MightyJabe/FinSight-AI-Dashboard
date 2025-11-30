import useSWR from 'swr';

import { useSession } from '@/components/providers/SessionProvider';
import { apiGet } from '@/lib/api-client';

const fetcher = async (url: string) => {
  const res = await apiGet(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function useProactiveInsights() {
  const { firebaseUser } = useSession();
  const swrKey = firebaseUser ? '/api/insights/proactive' : null;

  const { data, error, isLoading, mutate } = useSWR(swrKey, fetcher);

  return {
    insights: data?.insights || [],
    isLoading,
    error,
    refresh: mutate,
  };
}
