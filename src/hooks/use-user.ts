import { useSession } from '@/components/providers/SessionProvider';

/**
 *
 */
export function useUser() {
  const { user, loading } = useSession();
  return { user, loading };
}
