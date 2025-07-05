'use client';

import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

import { CategoryBreakdown } from './CategoryBreakdown';
import { DateRangeSelector } from './DateRangeSelector';
import { TransactionsList } from './TransactionsList';
import { AICategorization } from './AICategorization';
import { SpendingBreakdown } from './SpendingBreakdown';

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

  const handleCategorizationComplete = () => {
    // Trigger a refresh by updating the key prop
    window.dispatchEvent(new CustomEvent('categorization-complete'));
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          {selectedCategory && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600">Filtered by:</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm font-medium">
                {selectedCategory}
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            </div>
          )}
        </div>
        <DateRangeSelector
          onDateRangeChange={(newFrom, newTo) => {
            setDateRange({ from: newFrom, to: newTo });
            // You might want to trigger fetching transactions here if not already handled by an effect
          }}
        />
      </div>

      {/* Spending Overview at Top */}
      <div className="mb-8">
        <SpendingBreakdown 
          onCategoryFilter={handleCategoryFilter}
          selectedCategory={selectedCategory}
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - AI Tools */}
        <div className="lg:col-span-1">
          <AICategorization onCategorizationComplete={handleCategorizationComplete} />
        </div>
        
        {/* Main Content - Transactions */}
        <div className="lg:col-span-3">
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
      </div>
    </div>
  );
}
