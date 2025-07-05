import { ErrorMessage } from '@/components/common/ErrorMessage';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useTransactions } from '@/hooks/use-transactions';
import type { Transaction } from '@/types/finance';

interface RecentTransactionsProps {
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transaction: Transaction) => void;
}

/**
 *
 */
export function RecentTransactions({
  onEditTransaction,
  onDeleteTransaction,
}: RecentTransactionsProps) {
  const { transactions, loading, error } = useTransactions();

  if (loading) {
    return <LoadingSpinner message="Loading transactions..." />;
  }

  if (error) {
    return <ErrorMessage message="Error loading transactions" />;
  }

  if (!transactions?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Recent Transactions</h2>
      </div>
      <div className="divide-y">
        {transactions.slice(0, 10).map(transaction => (
          <div key={transaction.id} className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{transaction.description || transaction.category}</p>
              <p className="text-sm text-gray-500">{transaction.date}</p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`font-medium ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                ${Math.abs(transaction.amount).toLocaleString()}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onEditTransaction(transaction)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteTransaction(transaction)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
