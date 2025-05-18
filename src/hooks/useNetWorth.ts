import useSWR from 'swr';
import { useUser } from './useUser';

export function useNetWorth() {
  const { user, loading: userLoading } = useUser();
  const {
    data: overview,
    isLoading,
    error,
  } = useSWR(user ? ['overview', user.uid] : null, () =>
    fetch('/api/overview').then(res => res.json())
  );
  return {
    netWorth: overview?.netWorth ?? 0,
    loading: userLoading || isLoading,
    error,
  };
}
