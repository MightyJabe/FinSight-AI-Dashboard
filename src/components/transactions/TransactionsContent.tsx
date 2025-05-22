'use client';

import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import type { Transaction } from '@/lib/finance';

import { CategoryBreakdown } from './CategoryBreakdown';
import { DateRangeSelector } from './DateRangeSelector';
import { TransactionsList } from './TransactionsList';

interface TransactionsContentProps {
  transactions: Transaction[];
}

/**
 *
 */
export function TransactionsContent({
  transactions: initialTransactions,
}: TransactionsContentProps) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth() - 1, to.getDate()); // Default to last month
    return { from, to };
  });

  // Filter transactions by date range
  const filteredTransactions = initialTransactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= dateRange.from && transactionDate <= dateRange.to;
  });

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <DateRangeSelector
          onDateRangeChange={(newFrom, newTo) => {
            setDateRange({ from: newFrom, to: newTo });
            // You might want to trigger fetching transactions here if not already handled by an effect
          }}
        />
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <TransactionsList transactions={filteredTransactions} />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryBreakdown transactions={filteredTransactions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
