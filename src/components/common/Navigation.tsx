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
  { href: '/settings', label: 'Settings', icon: Settings, description: 'Preferences' },
];

export function Navigation() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <nav
      className={`bg-card border-r border-border flex flex-col h-full transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-shadow">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="font-semibold text-foreground tracking-tight text-sm">FinSight AI</h1>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
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
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {navigationGroups.map((group) => (
          <div key={group.label} className="mb-6">
            {!collapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    title={collapsed ? item.label : undefined}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-background' : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    />
                    {!collapsed && (
                      <span
                        className={`text-sm font-medium truncate ${
                          isActive ? 'text-background' : 'text-foreground'
                        }`}
                      >
                        {item.label}
                      </span>
                    )}
                    {isActive && !collapsed && (
                      <div className="ml-auto w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Items */}
      <div className="p-3 border-t border-border space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                }`}
              />
              {!collapsed && (
                <span className="text-sm font-medium text-foreground truncate">
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
