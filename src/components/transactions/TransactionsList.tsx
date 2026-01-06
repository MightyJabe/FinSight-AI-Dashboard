'use client';

import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Receipt,
  Search,
  X,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { Skeleton } from '@/components/common/SkeletonLoader';
import { useSession } from '@/components/providers/SessionProvider';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

import { TransactionRow } from './TransactionRow';

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
  isLoading?: boolean;
}

type SortField = 'date' | 'description' | 'category' | 'amount';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

/**
 * Premium transactions list component with search, filtering, sorting, and pagination.
 * Features smooth animations, proper accessibility, and responsive design.
 */
export function TransactionsList({
  transactions: initialTransactions,
  isLoading = false,
}: TransactionsListProps) {
  const { firebaseUser } = useSession();

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Category update state
  const [updatingCategories, setUpdatingCategories] = useState<Set<string>>(new Set());

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(initialTransactions.map(t => t.category));
    return ['all', ...Array.from(uniqueCategories).sort()];
  }, [initialTransactions]);

  // Get unique accounts (may be used for future account filtering)
  // const accounts = useMemo(() => {
  //   const uniqueAccounts = new Set(initialTransactions.map(t => t.account));
  //   return Array.from(uniqueAccounts).sort();
  // }, [initialTransactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return initialTransactions
      .filter(t => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesDescription = t.description.toLowerCase().includes(query);
          const matchesCategory = t.category.toLowerCase().includes(query);
          const matchesAccount = t.account.toLowerCase().includes(query);
          if (!matchesDescription && !matchesCategory && !matchesAccount) {
            return false;
          }
        }

        // Category filter
        if (filterCategory !== 'all' && t.category !== filterCategory) {
          return false;
        }

        // Type filter
        if (filterType !== 'all' && t.type !== filterType) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;

        switch (sortField) {
          case 'date':
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case 'description':
            comparison = a.description.localeCompare(b.description);
            break;
          case 'category':
            comparison = a.category.localeCompare(b.category);
            break;
          case 'amount':
            comparison = Math.abs(a.amount) - Math.abs(b.amount);
            break;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [initialTransactions, searchQuery, filterCategory, filterType, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Calculate stats
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expenses, net: income - expenses };
  }, [filteredTransactions]);

  // Handlers
  const handleSort = useCallback((field: SortField) => {
    setSortField(prev => {
      if (prev === field) {
        setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortDirection('desc');
      return field;
    });
  }, []);

  const handleCategoryUpdate = useCallback(
    async (transactionId: string, newCategory: string, transactionType: 'income' | 'expense') => {
      if (!firebaseUser) return;

      setUpdatingCategories(prev => new Set(prev).add(transactionId));

      try {
        const idToken = await firebaseUser.getIdToken();
        const response = await fetch('/api/transactions/update-category', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
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

        window.dispatchEvent(new CustomEvent('transaction-updated'));
      } catch (error) {
        console.error('Error updating category:', error);
      } finally {
        setUpdatingCategories(prev => {
          const newSet = new Set(prev);
          newSet.delete(transactionId);
          return newSet;
        });
      }
    },
    [firebaseUser]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterType('all');
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = searchQuery || filterCategory !== 'all' || filterType !== 'all';

  // Reset to first page when filters change
  const handleFilterChange = useCallback((setter: (value: any) => void, value: any) => {
    setter(value);
    setCurrentPage(1);
  }, []);

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="w-4 h-4" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUpAZ className="w-4 h-4 text-foreground" />
    ) : (
      <ArrowDownAZ className="w-4 h-4 text-foreground" />
    );
  };

  if (isLoading) {
    return <TransactionsListSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={e => handleFilterChange(setSearchQuery, e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="bg-card border-border"
            data-testid="transaction-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => handleFilterChange(setSearchQuery, '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={e => handleFilterChange(setFilterCategory, e.target.value)}
              className={cn(
                'px-3 py-2 text-sm rounded-lg border transition-colors',
                'bg-card border-border text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'dark:bg-card dark:border-border'
              )}
              data-testid="category-filter"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={e => handleFilterChange(setFilterType, e.target.value as 'all' | 'income' | 'expense')}
              className={cn(
                'px-3 py-2 text-sm rounded-lg border transition-colors',
                'bg-card border-border text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'dark:bg-card dark:border-border'
              )}
              data-testid="type-filter"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-1 text-sm text-muted-foreground">
        <p>
          Showing <span className="font-medium text-foreground">{paginatedTransactions.length}</span> of{' '}
          <span className="font-medium text-foreground">{filteredTransactions.length}</span> transactions
        </p>
        <div className="flex items-center gap-4">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            +${stats.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-rose-600 dark:text-rose-400 font-medium">
            -${stats.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        {paginatedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {hasActiveFilters
                ? 'Try adjusting your filters or search query to find transactions.'
                : 'No transactions to display. Connect your accounts or add manual transactions.'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('date')}
                      className={cn(
                        'flex items-center gap-2 font-medium text-sm transition-colors',
                        sortField === 'date' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      )}
                      aria-label={`Sort by date ${sortField === 'date' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : ''}`}
                    >
                      Date
                      <SortIndicator field="date" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('description')}
                      className={cn(
                        'flex items-center gap-2 font-medium text-sm transition-colors',
                        sortField === 'description' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      )}
                      aria-label={`Sort by description ${sortField === 'description' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : ''}`}
                    >
                      Description
                      <SortIndicator field="description" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('category')}
                      className={cn(
                        'flex items-center gap-2 font-medium text-sm transition-colors',
                        sortField === 'category' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      )}
                      aria-label={`Sort by category ${sortField === 'category' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : ''}`}
                    >
                      Category
                      <SortIndicator field="category" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('amount')}
                      className={cn(
                        'flex items-center gap-2 font-medium text-sm justify-end ml-auto transition-colors',
                        sortField === 'amount' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      )}
                      aria-label={`Sort by amount ${sortField === 'amount' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : ''}`}
                    >
                      Amount
                      <SortIndicator field="amount" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedTransactions.map((transaction, index) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    onCategoryUpdate={handleCategoryUpdate}
                    isUpdating={updatingCategories.has(transaction.id)}
                    index={index}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredTransactions.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Items per page selector */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={cn(
                'px-2 py-1 rounded-lg border transition-colors',
                'bg-card border-border text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring'
              )}
              data-testid="items-per-page-select"
            >
              {ITEMS_PER_PAGE_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span>per page</span>
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              aria-label="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1 mx-2">
              {generatePageNumbers(currentPage, totalPages).map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => handlePageChange(page as number)}
                    className={cn(
                      'min-w-[2rem] tabular-nums',
                      currentPage === page && 'font-semibold'
                    )}
                    aria-label={`Page ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </Button>
                )
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Page indicator */}
          <p className="text-sm text-muted-foreground tabular-nums">
            Page <span className="font-medium text-foreground">{currentPage}</span> of{' '}
            <span className="font-medium text-foreground">{totalPages}</span>
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Generate page numbers with ellipsis for pagination
 */
function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total);
  } else if (current >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }

  return pages;
}

/**
 * Loading skeleton for the transactions list
 */
function TransactionsListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search and filters skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Summary skeleton */}
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-secondary/50 p-4">
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

export { TransactionsListSkeleton };
