import { TransactionsContent } from '@/components/transactions/TransactionsContent';
import { getTransactions } from '@/lib/finance';

/**
 *
 */
export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return (
    <div className="pl-72">
      <div className="container max-w-7xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="mt-2 text-muted-foreground">View and manage your financial transactions</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <TransactionsContent transactions={transactions} />
        </div>
      </div>
    </div>
  );
}
