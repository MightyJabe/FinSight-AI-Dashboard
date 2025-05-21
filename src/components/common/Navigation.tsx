'use client';

import {
  BarChart3,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  LogOut,
  PlusCircle,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/lib/auth';
import { auth as firebaseAuth } from '@/lib/firebase';

const primaryNavigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Accounts', href: '/accounts', icon: Users },
  { name: 'Transactions', href: '/transactions', icon: ListChecks },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
  { name: 'Add Manual Data', href: '/manual-data', icon: PlusCircle },
];

const secondaryNavigationItems = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

/**
 *
 */
export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut();
      router.push('/');
      if (isOpen) setIsOpen(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-between p-4 h-[68px]">
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse md:hidden"></div>
        <div className="hidden md:flex space-x-2">
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || 'No email available';

  return (
    <nav
      className="fixed left-0 top-0 h-full w-72 border-r bg-gradient-to-b from-background/95 to-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 flex flex-col"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="p-6 border-b">
        <Link
          href={user ? '/dashboard' : '/'}
          className="text-2xl font-bold text-gray-800 hover:text-primary transition-colors"
        >
          FinSight AI
        </Link>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-1">
        {primaryNavigationItems.map(item => {
          const isActive =
            pathname === item.href ||
            (item.href === '/dashboard' && pathname.startsWith('/dashboard'));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon
                className={`h-5 w-5 transition-transform duration-200 ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground group-hover:text-accent-foreground'
                }`}
                aria-hidden="true"
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t space-y-1">
        {secondaryNavigationItems.map(item => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? 'bg-accent/80 text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon
                className={`h-5 w-5 transition-transform duration-200 ${
                  isActive
                    ? 'text-accent-foreground'
                    : 'text-muted-foreground group-hover:text-accent-foreground'
                }`}
                aria-hidden="true"
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <LogOut
            className="h-5 w-5 text-muted-foreground group-hover:text-red-600"
            aria-hidden="true"
          />
          <span className="truncate">Logout</span>
        </button>
      </div>

      <div className="p-4 border-t">
        {!loading && user ? (
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold"
              aria-hidden="true"
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate" title={displayName}>
                {displayName}
              </span>
              <span className="text-xs text-muted-foreground truncate" title={displayEmail}>
                {displayEmail}
              </span>
            </div>
          </div>
        ) : loading ? (
          <div className="text-sm text-muted-foreground">Loading user...</div>
        ) : (
          <div className="text-sm text-muted-foreground">Not signed in</div>
        )}
      </div>
    </nav>
  );
}
