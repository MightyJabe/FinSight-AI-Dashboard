import { useSession } from '@/app/layout';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push('/login');
    }
  }, [session, router]);

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark">
      <h1 className="text-3xl font-bold text-primary">Welcome to your Dashboard!</h1>
    </div>
  );
}
