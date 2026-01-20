'use client';

import { AlertCircle, CreditCard, Plus, Receipt, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import { TransactionsContent } from '@/components/transactions/TransactionsContent';
import { Button, DashboardSkeleton } from '@/components/ui';
import { useUserSettings } from '@/hooks/use-user-settings';
import { cn } from '@/lib/utils';

// Extended transaction interface with AI categorization data
interface EnhancedTransaction {
  id: string;
  providerTxId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  aiCategory?: string;
  aiConfidence?: number;
  date: string;
  description: string;
  account: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
  currency?: string;
  source?: string;
}

interface PlaidTransaction {
  transaction_id: string;
  date: string;
  name: string;
  amount: number;
  category?: string[];
  account_name: string;
  account_id: string;
}

interface ManualTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Trigger AI categorization for uncategorized transactions
 */
async function triggerAICategorization(idToken: string, transactions: EnhancedTransaction[]) {
  try {
    // Format transactions for categorization API
    const transactionsToProcess = transactions.map(t => ({
      id: t.id,
      amount: t.type === 'income' ? -Math.abs(t.amount) : Math.abs(t.amount),
      description: t.description,
      date: t.date,
      originalCategory: t.category ? [t.category] : undefined,
    }));

    // Call categorization API
    const response = await fetch('/api/transactions/categorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ transactions: transactionsToProcess }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('AI categorization completed:', result.data?.summary);
      // Dispatch event to refresh transactions
      window.dispatchEvent(new Event('categorization-complete'));
    }
  } catch (error) {
    console.error('Failed to trigger AI categorization:', error);
  }
}

/**
 * Premium transactions page with dashboard-quality styling.
 * Features AI-powered categorization, search, filtering, and analytics.
 */
export default function TransactionsPage() {
  const { firebaseUser, loading: authLoading } = useSession();
  const { settings } = useUserSettings(Boolean(firebaseUser));
  const [transactions, setTransactions] = useState<EnhancedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiCategorizationTriggered, setAiCategorizationTriggered] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      setLoading(true);
      setError(null);

      // Get the ID token
      const idToken = await firebaseUser.getIdToken();

      // Fetch Plaid, manual transactions, Israeli transactions, and AI categorized data
      const [plaidResponse, manualResponse, israeliResponse, categorizedResponse] = await Promise.all([
        fetch('/api/plaid/transactions', {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }),
        fetch('/api/manual-data?type=transactions', {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }),
        fetch('/api/banking/transactions', {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }),
        fetch('/api/transactions/categorized', {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }),
      ]);

      if (!plaidResponse.ok) {
        throw new Error(`Failed to fetch Plaid transactions: ${plaidResponse.statusText}`);
      }

      if (!manualResponse.ok) {
        throw new Error(`Failed to fetch manual transactions: ${manualResponse.statusText}`);
      }

      const [plaidData, manualData, israeliData] = await Promise.all([
        plaidResponse.json(),
        manualResponse.json(),
        israeliResponse.ok ? israeliResponse.json() : { transactions: [] },
      ]);

      // Get categorized data
      let categorizedData: { categorizedTransactions: Record<string, { aiCategory?: string; aiConfidence?: number; type?: 'income' | 'expense' }> } = { categorizedTransactions: {} };
      if (categorizedResponse.ok) {
        const catData = await categorizedResponse.json();
        if (catData.success) {
          categorizedData = catData.data;
        }
      }

      // Map Plaid transactions to our internal format
      const plaidTransactions = plaidData.transactions.map((t: PlaidTransaction) => {
        const categorizedInfo = categorizedData.categorizedTransactions[t.transaction_id];
        // Use AI category if available, otherwise mark as uncategorized for AI processing
        const category = categorizedInfo?.aiCategory || 'Uncategorized';

        return {
          id: t.transaction_id,
          providerTxId: t.transaction_id, // Plaid transaction_id is unique
          date: t.date,
          description: t.name,
          amount: -t.amount, // Invert Plaid amounts
          category,
          aiCategory: categorizedInfo?.aiCategory,
          aiConfidence: categorizedInfo?.aiConfidence,
          account: t.account_name,
          accountId: t.account_id,
          type: categorizedInfo?.type || (t.amount < 0 ? 'income' : 'expense'), // Inverted logic for type
          createdAt: t.date,
          updatedAt: t.date,
        };
      });

      // Map manual transactions to our internal format
      const manualTransactions = manualData.map((t: ManualTransaction) => ({
        id: t.id,
        providerTxId: t.id, // Manual transactions use their ID as providerTxId
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
        account: t.accountId, // Using accountId as account name for manual transactions
        accountId: t.accountId,
        type: t.type,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));

      // Map Israeli bank transactions to our internal format
      const israeliTransactions = (israeliData.transactions || []).map((t: { id: string; providerTxId?: string; date: string; description: string; name: string; amount: number; originalAmount: number; category: string; account_name: string; account_id: string; originalCurrency: string }) => ({
        id: t.id,
        providerTxId: t.providerTxId || t.id, // Use providerTxId from API, fallback to id
        date: t.date,
        description: t.description || t.name,
        amount: t.amount || t.originalAmount,
        category: t.category || 'Uncategorized',
        account: t.account_name,
        accountId: t.account_id,
        type: (t.amount || t.originalAmount) > 0 ? 'income' as const : 'expense' as const,
        createdAt: t.date,
        updatedAt: t.date,
        currency: t.originalCurrency || 'ILS',
        source: 'israel',
      }));

      // Combine and deduplicate transactions from all sources
      // Priority: Israeli transactions > Manual > Plaid (for duplicates)
      const transactionMap = new Map<string, EnhancedTransaction>();

      // Helper to create a deduplication key
      const getDedupeKey = (tx: EnhancedTransaction) =>
        `${tx.description}|${tx.date}|${Math.abs(tx.amount).toFixed(2)}`;

      // Add Plaid transactions first (lowest priority for dupes)
      for (const tx of plaidTransactions) {
        transactionMap.set(getDedupeKey(tx), tx);
      }

      // Add manual transactions (medium priority)
      for (const tx of manualTransactions) {
        transactionMap.set(getDedupeKey(tx), tx);
      }

      // Add Israeli transactions last (highest priority - has correct currency)
      for (const tx of israeliTransactions) {
        transactionMap.set(getDedupeKey(tx), tx);
      }

      let allTransactions = Array.from(transactionMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      if (settings.useDemoData && plaidTransactions.length === 0) {
        const now = new Date();
        const demoTransactions: EnhancedTransaction[] = [
          {
            id: 'demo-tx-1',
            providerTxId: 'demo-tx-1',
            date: now.toISOString().slice(0, 10),
            description: 'Paycheck - Company Inc.',
            amount: 4200,
            category: 'Salary',
            account: 'Main Checking',
            accountId: 'demo-checking',
            type: 'income',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
          {
            id: 'demo-tx-2',
            providerTxId: 'demo-tx-2',
            date: new Date(now.getTime() - 86400000).toISOString().slice(0, 10),
            description: 'Whole Foods Market',
            amount: -127.45,
            category: 'Groceries',
            account: 'Main Checking',
            accountId: 'demo-checking',
            type: 'expense',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
          {
            id: 'demo-tx-3',
            providerTxId: 'demo-tx-3',
            date: new Date(now.getTime() - 86400000 * 2).toISOString().slice(0, 10),
            description: 'Monthly Rent Payment',
            amount: -1850,
            category: 'Housing',
            account: 'Main Checking',
            accountId: 'demo-checking',
            type: 'expense',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
          {
            id: 'demo-tx-4',
            providerTxId: 'demo-tx-4',
            date: new Date(now.getTime() - 86400000 * 3).toISOString().slice(0, 10),
            description: 'Netflix Subscription',
            amount: -15.99,
            category: 'Entertainment',
            account: 'Credit Card',
            accountId: 'demo-credit',
            type: 'expense',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
          {
            id: 'demo-tx-5',
            providerTxId: 'demo-tx-5',
            date: new Date(now.getTime() - 86400000 * 4).toISOString().slice(0, 10),
            description: 'Gas Station',
            amount: -52.30,
            category: 'Transportation',
            account: 'Credit Card',
            accountId: 'demo-credit',
            type: 'expense',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
          {
            id: 'demo-tx-6',
            providerTxId: 'demo-tx-6',
            date: new Date(now.getTime() - 86400000 * 5).toISOString().slice(0, 10),
            description: 'Dividend Payment',
            amount: 125.50,
            category: 'Investment Returns',
            account: 'Investment Account',
            accountId: 'demo-investment',
            type: 'income',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
          {
            id: 'demo-tx-7',
            providerTxId: 'demo-tx-7',
            date: new Date(now.getTime() - 86400000 * 6).toISOString().slice(0, 10),
            description: 'Starbucks Coffee',
            amount: -6.45,
            category: 'Dining Out',
            account: 'Credit Card',
            accountId: 'demo-credit',
            type: 'expense',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
          {
            id: 'demo-tx-8',
            providerTxId: 'demo-tx-8',
            date: new Date(now.getTime() - 86400000 * 7).toISOString().slice(0, 10),
            description: 'Electric Bill',
            amount: -95.20,
            category: 'Utilities',
            account: 'Main Checking',
            accountId: 'demo-checking',
            type: 'expense',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
          {
            id: 'demo-tx-9',
            providerTxId: 'demo-tx-9',
            date: new Date(now.getTime() - 86400000 * 10).toISOString().slice(0, 10),
            description: 'Gym Membership',
            amount: -49.99,
            category: 'Fitness & Health',
            account: 'Credit Card',
            accountId: 'demo-credit',
            type: 'expense',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
          {
            id: 'demo-tx-10',
            providerTxId: 'demo-tx-10',
            date: new Date(now.getTime() - 86400000 * 12).toISOString().slice(0, 10),
            description: 'Amazon Purchase',
            amount: -89.99,
            category: 'Shopping',
            account: 'Credit Card',
            accountId: 'demo-credit',
            type: 'expense',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
        ];
        allTransactions = [...demoTransactions, ...manualTransactions];
      }

      setTransactions(allTransactions);

      // Automatically trigger AI categorization for uncategorized transactions
      if (!aiCategorizationTriggered) {
        const uncategorizedTransactions = allTransactions.filter(
          t => t.category === 'Uncategorized' && !t.aiCategory
        );

        if (uncategorizedTransactions.length > 0) {
          setAiCategorizationTriggered(true);
          // Trigger AI categorization in the background
          triggerAICategorization(idToken, uncategorizedTransactions);
        }
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, aiCategorizationTriggered, settings.useDemoData]);

  useEffect(() => {
    fetchTransactions();

    // Listen for transaction updates
    const handleTransactionUpdate = () => {
      setTimeout(() => fetchTransactions(), 500); // Small delay to ensure data is saved
    };

    const handleCategorizationComplete = () => {
      setTimeout(() => fetchTransactions(), 1000); // Longer delay for categorization to complete
    };

    window.addEventListener('transaction-updated', handleTransactionUpdate);
    window.addEventListener('categorization-complete', handleCategorizationComplete);
    return () => {
      window.removeEventListener('transaction-updated', handleTransactionUpdate);
      window.removeEventListener('categorization-complete', handleCategorizationComplete);
    };
  }, [fetchTransactions]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
          {/* Header Skeleton */}
          <header className="mb-10 animate-in">
            <div className="flex items-start justify-between">
              <div>
                <div className="h-4 w-20 bg-muted rounded animate-pulse mb-2" />
                <div className="h-10 w-64 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-10 w-32 bg-muted rounded-full animate-pulse" />
            </div>
          </header>

          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen">
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
          <div className="max-w-md mx-auto mt-20 p-8 rounded-2xl bg-card border border-border animate-in">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Unable to load transactions</h2>
              <p className="text-muted-foreground text-sm mb-6">{error}</p>
              <Button onClick={fetchTransactions} className="rounded-full">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="mb-10 animate-in">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">Financial Activity</p>
              <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
                Transactions
              </h1>
            </div>
            <Link
              href="/manual-data"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full',
                'bg-foreground text-background text-sm font-medium',
                'hover:opacity-90 transition-opacity'
              )}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Transaction</span>
            </Link>
          </div>

          {/* Demo Mode Banner */}
          {settings.useDemoData && (
            <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-in delay-75">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Viewing demo transactions.{' '}
                <Link href="/accounts" className="underline underline-offset-2 font-medium">
                  Connect your accounts
                </Link>{' '}
                to see real data.
              </p>
            </div>
          )}
        </header>

        {/* Quick Stats Banner */}
        <section className="mb-8 animate-in delay-75">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-900 dark:to-black p-6 lg:p-8">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/2 -right-1/4 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-1/2 -left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-neutral-400 text-sm uppercase tracking-wider">Total Transactions</p>
                  <p className="text-2xl font-semibold text-white tabular-nums">{transactions.length}</p>
                </div>
              </div>

              <div className="hidden sm:block w-px h-12 bg-white/10" />

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-neutral-400 text-sm uppercase tracking-wider">Income Sources</p>
                  <p className="text-2xl font-semibold text-emerald-400 tabular-nums">
                    {transactions.filter(t => t.type === 'income').length}
                  </p>
                </div>
              </div>

              <div className="hidden sm:block w-px h-12 bg-white/10" />

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <p className="text-neutral-400 text-sm uppercase tracking-wider">Expenses</p>
                  <p className="text-2xl font-semibold text-rose-400 tabular-nums">
                    {transactions.filter(t => t.type === 'expense').length}
                  </p>
                </div>
              </div>

              <div className="hidden lg:block w-px h-12 bg-white/10" />

              <div className="hidden lg:flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <p className="text-neutral-400 text-sm uppercase tracking-wider">Accounts</p>
                  <p className="text-2xl font-semibold text-violet-400 tabular-nums">
                    {new Set(transactions.map(t => t.accountId)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="animate-in delay-150">
          <TransactionsContent
            transactions={transactions}
            isLoading={loading}
          />
        </section>
      </div>
    </div>
  );
}
