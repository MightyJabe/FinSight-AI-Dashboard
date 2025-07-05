'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { Logo } from '@/components/common/Logo';
import { useSession } from '@/components/providers/SessionProvider';
import { Button } from '@/components/ui/Button';

/**
 *
 */
export function Header() {
  const { user, signOut } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Successfully logged out!');
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to log out');
    }
  };

  const toggleDarkMode = () => {
    const root = document.documentElement;
    root.classList.toggle('dark');
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur bg-background/80 border-b shadow-sm">
      <div className="flex h-20 items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-3">
            <Logo width={40} height={40} className="h-10 w-10" />
            <div className="flex flex-col leading-tight justify-center">
              <div>
                <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-logoGradientStart via-accent to-logoGradientEnd text-transparent bg-clip-text drop-shadow">
                  FinSight
                </span>
                <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-logoGradientEnd via-accent to-logoGradientStart text-transparent bg-clip-text ml-1 drop-shadow">
                  AI
                </span>
              </div>
              <span className="text-sm font-medium text-logoSubtitle">AI Dashboard</span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <button
            className="rounded-full p-2 bg-card/70 hover:bg-card transition shadow border border-border"
            aria-label="Toggle dark mode"
            onClick={toggleDarkMode}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 3v1m0 16v1m8.66-13.66-.71.71M4.05 19.95l-.71.71m16.97 0-.71-.71M4.05 4.05l-.71-.71M21 12h1M3 12H2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground font-medium hidden md:block">
                {user.email}
              </span>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary via-accent to-logoNode flex items-center justify-center text-white font-bold shadow">
                {user.email?.[0]?.toUpperCase()}
              </div>
              <Button variant="ghost" onClick={handleSignOut}>
                Log Out
              </Button>
            </div>
          )}
          {!user && (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button variant="primary" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
