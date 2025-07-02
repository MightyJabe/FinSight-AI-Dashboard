'use client';

import { useCallback, useEffect, useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import { TransactionsContent } from '@/components/transactions/TransactionsContent';
import type { Transaction } from '@/lib/finance';

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
 *
 */
export default function TransactionsPage() {
  const { user: _user, firebaseUser, loading: authLoading } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      setLoading(true);
      setError(null);

      // Get the ID token
      const idToken = await firebaseUser.getIdToken();

      // Fetch both Plaid and manual transactions
      const [plaidResponse, manualResponse] = await Promise.all([
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
      ]);

      if (!plaidResponse.ok) {
        throw new Error(`Failed to fetch Plaid transactions: ${plaidResponse.statusText}`);
      }

      if (!manualResponse.ok) {
        throw new Error(`Failed to fetch manual transactions: ${manualResponse.statusText}`);
      }

      const [plaidData, manualData] = await Promise.all([
        plaidResponse.json(),
        manualResponse.json(),
      ]);

      // Map Plaid transactions to our internal format
      const plaidTransactions = plaidData.transactions.map((t: PlaidTransaction) => ({
        id: t.transaction_id,
        date: t.date,
        description: t.name,
        amount: t.amount,
        category: t.category?.[0] || 'Uncategorized',
        account: t.account_name,
        accountId: t.account_id,
        type: t.amount > 0 ? 'income' : 'expense',
        createdAt: t.date,
        updatedAt: t.date,
      }));

      // Map manual transactions to our internal format
      const manualTransactions = manualData.map((t: ManualTransaction) => ({
        id: t.id,
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

      // Combine and sort transactions
      const allTransactions = [...plaidTransactions, ...manualTransactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setTransactions(allTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (authLoading || loading) {
    return <div className="p-4">Loading transactions...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="pl-72">
      <div className="container max-w-7xl py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Spending & Budget</h1>
          <p className="mt-2 text-lg text-gray-600">
            Track your spending, analyze patterns, and manage your budget across all accounts.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <TransactionsContent transactions={transactions} />
        </div>
      </div>
    </div>
  );
}
