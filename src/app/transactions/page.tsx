import { TransactionsContent } from '@/components/transactions/TransactionsContent';
import { getTransactions } from '@/lib/finance';

/**
 *
 */
export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return <TransactionsContent transactions={transactions} />;
}
