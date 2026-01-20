'use client';

/**
 * Currency Selector Component
 *
 * Modal for selecting the user's preferred base currency.
 * Used in settings to configure the display currency for all financial data.
 */

import { Check } from 'lucide-react';
import { useState } from 'react';

import { Button, Modal } from '@/components/ui';
import { auth as firebaseAuth } from '@/lib/firebase';
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from '@/lib/fx';

// Currency display information
const CURRENCY_INFO: Record<SupportedCurrency, { symbol: string; name: string; flag: string }> = {
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  ILS: { symbol: '₪', name: 'Israeli Shekel', flag: '🇮🇱' },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺' },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  JPY: { symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  CHF: { symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
};

interface CurrencySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentCurrency: SupportedCurrency;
  onCurrencyChange: (currency: SupportedCurrency) => void;
}

export function CurrencySelector({
  isOpen,
  onClose,
  currentCurrency,
  onCurrencyChange,
}: CurrencySelectorProps) {
  const [selected, setSelected] = useState<SupportedCurrency>(currentCurrency);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (selected === currentCurrency) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ baseCurrency: selected }),
      });

      if (!res.ok) {
        throw new Error('Failed to save currency preference');
      }

      onCurrencyChange(selected);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelected(currentCurrency);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Select Currency"
      description="Choose your preferred currency for displaying financial data."
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={saving}
          >
            Save
          </Button>
        </div>
      }
    >
      <div className="space-y-2">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {SUPPORTED_CURRENCIES.map((currency) => {
          const info = CURRENCY_INFO[currency];
          const isSelected = selected === currency;

          return (
            <button
              key={currency}
              onClick={() => setSelected(currency)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{info.flag}</span>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {currency}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {info.name}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 dark:text-gray-400 font-mono">
                  {info.symbol}
                </span>
                {isSelected && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

/**
 * Get display string for currency (e.g., "USD ($)")
 */
export function getCurrencyDisplayString(currency: SupportedCurrency): string {
  const info = CURRENCY_INFO[currency];
  return `${currency} (${info.symbol})`;
}

/**
 * Get currency info
 */
export function getCurrencyInfo(currency: SupportedCurrency) {
  return CURRENCY_INFO[currency];
}
