'use client';

import {
  BarChart3,
  Bitcoin,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileText,
  HelpCircle,
  Home,
  Lightbulb,
  MessageSquare,
  PiggyBank,
  Receipt,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navigationGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: Home, description: 'Financial overview' },
      { href: '/accounts', label: 'Accounts', icon: CreditCard, description: 'Connected accounts' },
      { href: '/transactions', label: 'Transactions', icon: DollarSign, description: 'All transactions' },
    ],
  },
  {
    label: 'Wealth',
    items: [
      { href: '/investments', label: 'Investments', icon: TrendingUp, description: 'Portfolio tracker' },
      { href: '/crypto', label: 'Crypto', icon: Bitcoin, description: 'Digital assets' },
      { href: '/goals', label: 'Goals', icon: Target, description: 'Savings goals' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/trends', label: 'Trends', icon: BarChart3, description: 'Spending trends' },
      { href: '/insights', label: 'AI Insights', icon: Lightbulb, description: 'Smart recommendations' },
      { href: '/chat', label: 'AI Chat', icon: MessageSquare, description: 'Financial assistant' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/subscriptions', label: 'Subscriptions', icon: Receipt, description: 'Recurring payments' },
      { href: '/tax', label: 'Tax', icon: PiggyBank, description: 'Tax planning' },
      { href: '/documents', label: 'Documents', icon: FileText, description: 'Financial docs' },
    ],
  },
];

const bottomItems = [
  { href: '/help', label: 'Help', icon: HelpCircle, description: 'Support & FAQ' },
  { href: '/onboarding', label: 'Onboarding', icon: Sparkles, description: 'Get started' },
  { href: '/settings', label: 'Settings', icon: Settings, description: 'Preferences' },
];

export function Navigation() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <nav
      className={`bg-card/80 backdrop-blur-xl border-r border-border flex flex-col h-full transition-all duration-500 ease-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo Section */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300 group-hover:scale-105">
              <Zap className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="font-display text-base text-foreground tracking-tight">FinSight</h1>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200 active:scale-95"
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-6 px-3">
        {navigationGroups.map((group, groupIndex) => (
          <div key={group.label} className="mb-8">
            {!collapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground px-3 mb-3">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    title={collapsed ? item.label : undefined}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-out relative overflow-hidden ${
                      isActive
                        ? 'bg-foreground text-background shadow-lg'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80 hover:translate-x-0.5'
                    }`}
                    style={{
                      animationDelay: `${(groupIndex * 2 + itemIndex) * 50}ms`,
                    }}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 rounded-r-full" />
                    )}
                    <Icon
                      className={`w-[18px] h-[18px] flex-shrink-0 transition-transform duration-300 ${
                        isActive ? 'text-background' : 'text-muted-foreground group-hover:text-foreground group-hover:scale-110'
                      }`}
                    />
                    {!collapsed && (
                      <span
                        className={`text-sm font-medium truncate transition-all duration-300 ${
                          isActive ? 'text-background' : 'text-foreground'
                        }`}
                      >
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Items */}
      <div className="p-4 border-t border-border space-y-1.5">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-out ${
                isActive
                  ? 'bg-secondary/80 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:translate-x-0.5'
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] flex-shrink-0 transition-transform duration-300 ${
                  isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground group-hover:scale-110'
                }`}
              />
              {!collapsed && (
                <span className="text-sm font-medium truncate">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
