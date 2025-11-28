'use client';

import { useEffect, useState } from 'react';

import type { CreateTransactionInput, TransactionType } from '@/types/platform';

interface TransactionFormProps {
  platformId: string;
  platformName: string;
  transactionType: 'deposit' | 'withdrawal' | undefined;
  onSubmit: (data: CreateTransactionInput) => Promise<void>;
  onCancel: () => void;
}

export default function TransactionForm({
  platformId,
  platformName,
  transactionType,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const dateString = new Date().toISOString();
  const defaultDateParts = dateString.split('T');
  const defaultDate = defaultDateParts[0] ?? new Date().toISOString().substring(0, 10);

  const [formData, setFormData] = useState<CreateTransactionInput>({
    platformId,
    type: transactionType || 'deposit',
    amount: 0,
    date: defaultDate,
    description: '',
    sourceAccountId: '',
  });

  useEffect(() => {
    // Fetch available bank accounts
    const fetchBankAccounts = async () => {
      try {
        const response = await fetch('/api/accounts');
        if (response.ok) {
          const data = await response.json();
          const banks =
            data.accounts?.filter((acc: any) =>
              ['depository', 'checking', 'savings'].includes(acc.type)
            ) || [];
          setBankAccounts(banks);
        }
      } catch (error) {
        console.error('Error fetching bank accounts:', error);
      }
    };

    fetchBankAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'amount'
          ? value
            ? parseFloat(value)
            : 0
          : name === 'type'
            ? (value as TransactionType)
            : name === 'description'
              ? value
              : value,
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {transactionType === 'deposit'
            ? '💰 Add Deposit'
            : transactionType === 'withdrawal'
              ? '🏧 Add Withdrawal'
              : 'Add Transaction'}{' '}
          to {platformName}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {transactionType === 'deposit'
            ? 'Record money you put into this platform'
            : transactionType === 'withdrawal'
              ? 'Record money you took out from this platform'
              : 'Record a deposit or withdrawal for this platform'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {!transactionType && (
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Transaction Type *
              </label>
              <select
                id="type"
                name="type"
                required
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="deposit">💰 Deposit (Money In)</option>
                <option value="withdrawal">🏧 Withdrawal (Money Out)</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Amount *
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                required
                min="0"
                step="any"
                value={formData.amount}
                onChange={handleChange}
                placeholder="e.g., 1000.00"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Transaction Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="sourceAccountId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {formData.type === 'deposit'
                ? 'Transfer From Bank Account'
                : 'Transfer To Bank Account'}{' '}
              (Optional)
            </label>
            <select
              id="sourceAccountId"
              name="sourceAccountId"
              value={formData.sourceAccountId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">Select bank account (optional)</option>
              {bankAccounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.institutionName} ($
                  {account.balances?.current?.toFixed(2) || '0.00'})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select which bank account the money{' '}
              {formData.type === 'deposit' ? 'came from' : 'went to'} for accurate net worth
              tracking
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            value={formData.description ?? ''}
            onChange={handleChange}
            placeholder="e.g., Monthly investment, Profit withdrawal, etc."
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || formData.amount <= 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading
              ? 'Adding...'
              : `Add ${formData.type === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
          </button>
        </div>
      </form>
    </div>
  );
}
