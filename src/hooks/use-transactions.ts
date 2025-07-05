import useSWR from 'swr';

import type { Transaction } from '@/types/finance';

import { useUser } from './use-user';

/**
 *
 */
export function useTransactions() {
  const { user, loading: userLoading } = useUser();
  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
  } = useSWR(user ? ['overview', user.uid] : null, () =>
    fetch('/api/overview').then(res => res.json())
  );
  const {
    data: manualTransactions,
    isLoading: manualLoading,
    error: manualError,
  } = useSWR(user ? ['manualTxns', user.uid] : null, () =>
    fetch('/api/manual-transactions').then(res => res.json())
  );

  // Merge Plaid and manual transactions for display
  const allTransactions: Transaction[] = [
    ...(overview?.transactions?.map((txn: Transaction) => ({ ...txn, _source: 'plaid' })) || []),
    ...(manualTransactions?.map((txn: Transaction) => ({
      ...txn,
      _source: 'manual',
      transaction_id: txn.id,
      name:
        txn.description ||
        txn.category ||
        (txn.type === 'income' ? 'Manual Income' : 'Manual Expense'),
      amount: txn.type === 'income' ? Math.abs(txn.amount) : -Math.abs(txn.amount),
      date: txn.date,
    })) || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    transactions: allTransactions,
    loading: userLoading || overviewLoading || manualLoading,
    error: overviewError || manualError,
  };
}
