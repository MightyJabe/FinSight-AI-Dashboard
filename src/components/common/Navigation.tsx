'use client';

import {
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileText,
  HelpCircle,
  Home,
  PlusCircle,
  Receipt,
  RefreshCw,
  Settings,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navigationSections = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: Home, description: 'Financial overview' },
    ],
  },
  {
    title: 'Manage',
    items: [
      {
        href: '/accounts',
        label: 'Accounts',
        icon: CreditCard,
        description: 'Bank & manual accounts',
      },
      {
        href: '/transactions',
        label: 'Transactions',
        icon: DollarSign,
        description: 'Transaction history',
      },
      { href: '/documents', label: 'Documents', icon: FileText, description: 'Upload & view docs' },
      {
        href: '/manual-data',
        label: 'Manual Entry',
        icon: PlusCircle,
        description: 'Add assets & debts',
      },
    ],
  },
  {
    title: 'Analyze',
    items: [
      {
        href: '/insights',
        label: 'AI Insights',
        icon: Zap,
        description: 'Smart financial analysis',
      },
      { href: '/trends', label: 'Trends', icon: BarChart3, description: 'Spending patterns' },
      {
        href: '/investments',
        label: 'Investments',
        icon: TrendingUp,
        description: 'Portfolio performance',
      },
    ],
  },
  {
    title: 'Optimize',
    items: [
      {
        href: '/tax',
        label: 'Tax Intelligence',
        icon: Receipt,
        description: 'Deductions & strategies',
      },
      {
        href: '/subscriptions',
        label: 'Subscriptions',
        icon: RefreshCw,
        description: 'Recurring charges',
      },
      { href: '/goals', label: 'Goals', icon: Target, description: 'Financial milestones' },
    ],
  },
  {
    title: 'AI Assistant',
    items: [{ href: '/chat', label: 'AI Chat', icon: Bot, description: 'Financial advisor chat' }],
  },
];

const settingsItem = {
  href: '/settings',
  label: 'Settings',
  icon: Settings,
  description: 'Account preferences',
};
const helpItem = {
  href: '/help',
  label: 'Help',
  icon: HelpCircle,
  description: 'Documentation & support',
};

export function Navigation() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <nav
      className={`bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'}`}
    >
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-gray-900">FinSight AI</h1>
                <p className="text-xs text-gray-500">Smart Finance</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {navigationSections.map(section => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={`group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mr-3 transition-colors ${
                        isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                      }`}
                    />
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            isActive ? 'text-blue-900' : 'text-gray-900'
                          }`}
                        >
                          {item.label}
                        </p>
                        <p
                          className={`text-xs truncate ${
                            isActive ? 'text-blue-600' : 'text-gray-500'
                          }`}
                        >
                          {item.description}
                        </p>
                      </div>
                    )}
                    {isActive && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100 space-y-1">
        <Link
          href={helpItem.href}
          prefetch={true}
          className={`group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
            pathname === helpItem.href
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <HelpCircle
            className={`w-5 h-5 mr-3 transition-colors ${
              pathname === helpItem.href
                ? 'text-gray-700'
                : 'text-gray-400 group-hover:text-gray-600'
            }`}
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{helpItem.label}</p>
              <p className="text-xs text-gray-500 truncate">{helpItem.description}</p>
            </div>
          )}
        </Link>
        <Link
          href={settingsItem.href}
          prefetch={true}
          className={`group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
            pathname === settingsItem.href
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Settings
            className={`w-5 h-5 mr-3 transition-colors ${
              pathname === settingsItem.href
                ? 'text-gray-700'
                : 'text-gray-400 group-hover:text-gray-600'
            }`}
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{settingsItem.label}</p>
              <p className="text-xs text-gray-500 truncate">{settingsItem.description}</p>
            </div>
          )}
        </Link>
      </div>
    </nav>
  );
}
