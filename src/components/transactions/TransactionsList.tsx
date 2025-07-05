'use client';

import { ArrowUpDown, Filter } from 'lucide-react';
import { useState } from 'react';
import { useSession } from '@/components/providers/SessionProvider';
import { CategoryEditor } from './CategoryEditor';
import { formatCurrency } from '@/utils/format';

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

interface TransactionsListProps {
  transactions: EnhancedTransaction[];
}

/**
 *
 */
export function TransactionsList({ transactions: initialTransactions }: TransactionsListProps) {
  const { firebaseUser } = useSession();
  const [sortField, setSortField] = useState<keyof EnhancedTransaction>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [updatingCategories, setUpdatingCategories] = useState<Set<string>>(new Set());

  // Get unique categories
  const categories = ['all', ...new Set(initialTransactions.map(t => t.category))];

  // Sort and filter transactions
  const sortedAndFilteredTransactions = [...initialTransactions]
    .filter(t => filterCategory === 'all' || t.category === filterCategory)
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortField === 'date') {
        // Ensure aValue and bValue are treated as strings for date conversion
        const dateA = new Date(aValue as string);
        const dateB = new Date(bValue as string);
        return sortDirection === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

  const handleSort = (field: keyof EnhancedTransaction) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleCategoryUpdate = async (transactionId: string, newCategory: string, transactionType: 'income' | 'expense') => {
    if (!firebaseUser) return;

    setUpdatingCategories(prev => new Set(prev).add(transactionId));

    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/transactions/update-category', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          category: newCategory,
          type: transactionType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      // Trigger a refresh of the parent component
      window.dispatchEvent(new CustomEvent('transaction-updated'));
      
    } catch (error) {
      console.error('Error updating category:', error);
      // You could add a toast notification here
    } finally {
      setUpdatingCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-sm text-gray-500">
              <th className="px-4 py-3">
                <button
                  onClick={() => handleSort('date')}
                  className="flex items-center gap-1 font-medium"
                >
                  Date
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => handleSort('description')}
                  className="flex items-center gap-1 font-medium"
                >
                  Description
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => handleSort('category')}
                  className="flex items-center gap-1 font-medium"
                >
                  Category
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort('amount')}
                  className="flex items-center gap-1 font-medium"
                >
                  Amount
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredTransactions.map(transaction => (
              <tr key={transaction.id} className="border-b last:border-0">
                <td className="px-4 py-3">{new Date(transaction.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium">{transaction.description}</td>
                <td className="px-4 py-3">
                  <CategoryEditor
                    currentCategory={transaction.category}
                    aiCategory={transaction.aiCategory}
                    aiConfidence={transaction.aiConfidence}
                    transactionType={transaction.type}
                    onCategoryChange={(newCategory) => 
                      handleCategoryUpdate(transaction.id, newCategory, transaction.type)
                    }
                    disabled={updatingCategories.has(transaction.id)}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(transaction.amount)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
