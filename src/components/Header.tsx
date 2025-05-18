'use client';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
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
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
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
          {!user && (
            <div className="flex items-center space-x-2 ml-4">
              <Link href="/login">
                <button className="px-4 py-1.5 rounded-md border border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition">
                  Login
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition">
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
