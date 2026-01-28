'use client';

import { Bell, ChevronDown, Crown, LogOut, Moon, Rocket, Search, Sun, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useCommandPalette } from '@/components/common/CommandPalette';
import { useSession } from '@/components/providers/SessionProvider';
import { Button } from '@/components/ui/button';
import { useUserSettings } from '@/hooks/use-user-settings';

export function Header() {
  const { user, signOut } = useSession();
  const router = useRouter();
  const { setOpen: setCommandPaletteOpen } = useCommandPalette();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { settings } = useUserSettings(Boolean(user));

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored === 'dark' || (!stored && prefersDark);
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    setShowUserMenu(false);
  };

  // Unauthenticated header (landing page)
  if (!user) {
    return (
      <header className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" prefetch={true} className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-shadow">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight">
              FinSight AI
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
            <Link href="/login" prefetch={true}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link href="/signup" prefetch={true}>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-5">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // Authenticated header (app)
  return (
    <header className="bg-card/90 backdrop-blur-xl border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-4">
        {/* Search Bar / Command Palette Trigger */}
        <div className="flex-1 max-w-xl">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full group relative"
            aria-label="Open command palette"
          >
            <div className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-hover:text-foreground transition-colors duration-300" />
              <div className="w-full pl-11 pr-4 py-2.5 bg-secondary/60 border border-border rounded-xl text-sm text-muted-foreground text-left hover:bg-secondary hover:border-muted-foreground/30 transition-all duration-300 group-hover:shadow-md">
                Search transactions, accounts...
              </div>
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-xs text-muted-foreground bg-background/80 border border-border rounded-md font-mono shadow-sm">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Upgrade Button (Free users) */}
          {settings.plan === 'free' && (
            <Link href="/settings" className="hidden sm:block">
              <Button
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 rounded-full px-4 shadow-md hover:shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 border-0"
              >
                <Crown className="w-3.5 h-3.5 mr-1.5" />
                Upgrade
              </Button>
            </Link>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-300 hover:scale-105 active:scale-95"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          {/* Notifications */}
          <button
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-300 hover:scale-105 active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-card animate-pulse" />
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 sm:gap-3 p-1.5 pr-2 sm:pr-3 hover:bg-secondary/80 rounded-xl transition-all duration-300 active:scale-95"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 transition-shadow">
                <span className="text-white text-sm font-semibold">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-28">
                  {user.email}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div
                className="absolute right-0 mt-3 w-64 bg-card rounded-2xl shadow-2xl border border-border py-2 z-50 overflow-hidden"
                style={{
                  animation: 'dropdownEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">
                    {user.displayName || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                </div>
                <div className="py-2">
                  <Link
                    href="/settings"
                    prefetch={true}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/80 transition-all duration-200 hover:translate-x-0.5"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-[18px] h-[18px] text-muted-foreground" />
                    <span className="font-medium">Account Settings</span>
                  </Link>
                  <Link
                    href="/onboarding"
                    prefetch={true}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/80 transition-all duration-200 hover:translate-x-0.5"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Rocket className="w-[18px] h-[18px] text-emerald-500" />
                    <span className="font-medium">Guided Onboarding</span>
                  </Link>
                </div>
                <div className="border-t border-border pt-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 hover:translate-x-0.5"
                  >
                    <LogOut className="w-[18px] h-[18px]" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dropdownEnter {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </header>
  );
}
