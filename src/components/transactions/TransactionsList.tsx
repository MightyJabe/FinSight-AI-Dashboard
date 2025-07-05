'use client';

import { ArrowUpDown, Filter } from 'lucide-react';
import { useState } from 'react';

import type { Transaction } from '@/lib/finance';
import { formatCurrency } from '@/utils/format';

interface TransactionsListProps {
  transactions: Transaction[];
}

/**
 *
 */
export function TransactionsList({ transactions: initialTransactions }: TransactionsListProps) {
  const [sortField, setSortField] = useState<keyof Transaction>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');

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

  const handleSort = (field: keyof Transaction) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
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
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                    {transaction.category}
                  </span>
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
