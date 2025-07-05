'use client';

import { useCallback, useEffect, useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import { TransactionsContent } from '@/components/transactions/TransactionsContent';

// Extended transaction interface with AI categorization data
interface EnhancedTransaction {
  id: string;
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
 *
 */
export default function TransactionsPage() {
  const { user: _user, firebaseUser, loading: authLoading } = useSession();
  const [transactions, setTransactions] = useState<EnhancedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      setLoading(true);
      setError(null);

      // Get the ID token
      const idToken = await firebaseUser.getIdToken();

      // Fetch Plaid, manual transactions, and AI categorized data
      const [plaidResponse, manualResponse, categorizedResponse] = await Promise.all([
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

      const [plaidData, manualData] = await Promise.all([
        plaidResponse.json(),
        manualResponse.json(),
      ]);

      // Get categorized data
      let categorizedData: any = { categorizedTransactions: {} };
      if (categorizedResponse.ok) {
        const catData = await categorizedResponse.json();
        if (catData.success) {
          categorizedData = catData.data;
        }
      }

      // Map Plaid transactions to our internal format
      const plaidTransactions = plaidData.transactions.map((t: PlaidTransaction) => {
        const categorizedInfo = categorizedData.categorizedTransactions[t.transaction_id];
        return {
          id: t.transaction_id,
          date: t.date,
          description: t.name,
          amount: t.amount,
          category: categorizedInfo?.aiCategory || t.category?.[0] || 'Uncategorized',
          aiCategory: categorizedInfo?.aiCategory,
          aiConfidence: categorizedInfo?.aiConfidence,
          account: t.account_name,
          accountId: t.account_id,
          type: categorizedInfo?.type || (t.amount > 0 ? 'income' : 'expense'),
          createdAt: t.date,
          updatedAt: t.date,
        };
      });

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

    // Listen for transaction updates
    const handleTransactionUpdate = () => {
      setTimeout(() => fetchTransactions(), 500); // Small delay to ensure data is saved
    };
    
    window.addEventListener('transaction-updated', handleTransactionUpdate);
    return () => window.removeEventListener('transaction-updated', handleTransactionUpdate);
  }, [fetchTransactions]);

  if (authLoading || loading) {
    return <div className="p-4">Loading transactions...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="max-w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Spending & Budget</h1>
        <p className="mt-2 text-lg text-gray-600">
          Track your spending, analyze patterns, and manage your budget across all accounts.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <TransactionsContent transactions={transactions} />
        </div>
      </div>
    </div>
  );
}
