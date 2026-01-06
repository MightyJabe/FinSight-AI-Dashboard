'use client';

import { CreditCard, Plus, Wallet } from 'lucide-react';
import Link from 'next/link';

import { ComprehensiveAccountsView } from '@/components/accounts/ComprehensiveAccountsView';
import { cn } from '@/lib/utils';

/**
 * Premium Accounts page with dashboard-quality styling.
 * Displays connected bank accounts, credit cards, and investment accounts.
 */
export default function AccountsPage() {
  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="mb-10 animate-in">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">Connected Accounts</p>
              <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
                Financial Overview
              </h1>
            </div>
            <Link
              href="/onboarding"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full',
                'bg-foreground text-background text-sm font-medium',
                'hover:opacity-90 transition-opacity'
              )}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Account</span>
            </Link>
          </div>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Track all your financial accounts, investments, properties, and liabilities in one
            comprehensive view.
          </p>
        </header>

        {/* Quick Stats Banner */}
        <section className="mb-8 animate-in delay-75">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-900 dark:to-black p-6 lg:p-8">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/2 -right-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-1/2 -left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-neutral-400 text-sm uppercase tracking-wider">Account Types</p>
                  <p className="text-2xl font-semibold text-white">Bank, Credit & Investments</p>
                </div>
              </div>

              <div className="hidden lg:block w-px h-12 bg-white/10" />

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-neutral-400 text-sm uppercase tracking-wider">Sync Status</p>
                  <p className="text-2xl font-semibold text-emerald-400">Real-time</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="animate-in delay-150">
          <ComprehensiveAccountsView />
        </section>
      </div>
    </div>
  );
}
