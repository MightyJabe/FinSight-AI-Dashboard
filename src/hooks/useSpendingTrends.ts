import useSWR from 'swr';

import { useSession } from '@/components/providers/SessionProvider';
import { apiGet } from '@/lib/api-client';

export type TrendAnalysisType =
  | 'category'
  | 'monthly'
  | 'weekly'
  | 'daily'
  | 'seasonal'
  | 'anomaly';
export type TrendTimeframe = '3months' | '6months' | '1year' | '2years';

const fetcher = async (url: string) => {
  const res = await apiGet(url);
  if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json();
  return data.data || data;
};

export function useSpendingTrends() {
  const { firebaseUser } = useSession();
  const swrKey = firebaseUser ? '/api/analytics/spending-trends' : null;

  const { data, error, isLoading } = useSWR(swrKey, fetcher);

  return {
    trends: data,
    insights: data?.insights || [],
    factors: data?.factors || [],
    isLoading,
    error,
  };
}
