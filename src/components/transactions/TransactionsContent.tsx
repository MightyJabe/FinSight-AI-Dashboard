'use client';

import { Filter } from 'lucide-react';
import { useState } from 'react';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

import { CategoryBreakdown } from './CategoryBreakdown';
import { DateRangeSelector } from './DateRangeSelector';
import { SpendingBreakdown } from './SpendingBreakdown';
import { TransactionsList } from './TransactionsList';

// Enhanced transaction interface
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

interface TransactionsContentProps {
  transactions: EnhancedTransaction[];
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter transactions by date range and category
  const filteredTransactions = initialTransactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    const dateMatch = transactionDate >= dateRange.from && transactionDate <= dateRange.to;
    const categoryMatch = !selectedCategory || transaction.category === selectedCategory;
    return dateMatch && categoryMatch;
  });

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  return (
    <div className="space-y-6">
      <Card variant="flat" padding="md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Transactions</h1>
            {selectedCategory && (
              <div className="flex items-center gap-2 mt-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Filtered by:</span>
                <Button variant="outline" size="sm" onClick={() => setSelectedCategory(null)}>
                  {selectedCategory} ×
                </Button>
              </div>
            )}
          </div>
          <DateRangeSelector
            onDateRangeChange={(newFrom, newTo) => {
              setDateRange({ from: newFrom, to: newTo });
            }}
          />
        </div>
      </Card>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Spending Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <SpendingBreakdown
            onCategoryFilter={handleCategoryFilter}
            selectedCategory={selectedCategory}
          />
        </CardContent>
      </Card>

      {/* Main Content - Transactions */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
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
