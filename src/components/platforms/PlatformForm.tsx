'use client';

import { useState } from 'react';

import type { CreatePlatformInput, Currency, Platform, PlatformType } from '@/types/platform';

interface PlatformFormProps {
  platform: Platform | undefined;
  onSubmit: (data: CreatePlatformInput) => Promise<void>;
  onCancel: () => void;
}

const PLATFORM_TYPES: { value: PlatformType; label: string }[] = [
  { value: 'stock_broker', label: 'Stock Broker' },
  { value: 'crypto_exchange', label: 'Crypto Exchange' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'bank_investment', label: 'Bank Investment' },
  { value: 'retirement', label: 'Retirement Account' },
  { value: 'crowdfunding', label: 'Crowdfunding' },
  { value: 'forex', label: 'Forex' },
  { value: 'other', label: 'Other' },
];

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'ILS', label: 'ILS (₪)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'Other', label: 'Other' },
];

export default function PlatformForm({ platform, onSubmit, onCancel }: PlatformFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePlatformInput>({
    name: platform?.name || '',
    type: platform?.type || 'stock_broker',
    currency: platform?.currency || 'USD',
    currentBalance: platform?.currentBalance || 0,
    notes: platform?.notes || undefined,
  });

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
      [name]: name === 'currentBalance' ? (value ? parseFloat(value) : 0) : value || undefined,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Platform Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Interactive Brokers, Binance, My Property"
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Platform Type *
          </label>
          <select
            id="type"
            name="type"
            required
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            {PLATFORM_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="currency"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Currency *
          </label>
          <select
            id="currency"
            name="currency"
            required
            value={formData.currency}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            {CURRENCIES.map(currency => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="currentBalance"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Current Balance (Optional)
          </label>
          <input
            type="number"
            id="currentBalance"
            name="currentBalance"
            min="0"
            step="any"
            value={formData.currentBalance}
            onChange={handleChange}
            placeholder="0.00"
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave at 0 to track everything through deposits/withdrawals. Enter current value if you
            want to include existing investments.
          </p>
        </div>
      </div>

      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={formData.notes || ''}
          onChange={handleChange}
          placeholder="Additional information about this platform..."
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
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
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : platform ? 'Update Platform' : 'Add Platform'}
        </button>
      </div>
    </form>
  );
}
