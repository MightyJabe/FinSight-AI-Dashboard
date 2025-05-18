'use client';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useSession } from '@/components/providers/SessionProvider';
import toast from 'react-hot-toast';

export function Header() {
  const user = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    if (!auth) {
      console.error('Firebase auth is not initialized');
      return;
    }

    try {
      await signOut(auth);
      toast.success('Successfully logged out!');
      router.push('/login');
    } catch {
      toast.error('Failed to log out');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center gap-3">
            <Logo width={32} height={32} className="h-8 w-8" />
            <div className="flex flex-col leading-tight justify-center">
              <div>
                <span className="font-extrabold text-xl tracking-tight text-logoText">
                  FinSight
                </span>
                <span className="font-bold text-xl tracking-tight bg-gradient-to-br from-primary via-accent to-logoNode text-transparent bg-clip-text ml-1 drop-shadow-[0_2px_8px_rgba(164,33,175,0.45)]">
                  AI
                </span>
              </div>
              <span className="text-xs font-medium text-secondary-foreground opacity-90">
                AI Dashboard
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <nav className="flex items-center space-x-6">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Dashboard
                </Link>
                <Link
                  href="/analytics"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Analytics
                </Link>
                <Link
                  href="/insights"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Insights
                </Link>
              </nav>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-1.5 rounded-md border border-destructive text-destructive font-semibold hover:bg-destructive hover:text-destructive-foreground transition"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-md border border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition"
                >
                  Login
                </button>
              </Link>
              <Link href="/signup">
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
                >
                  Sign Up
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
