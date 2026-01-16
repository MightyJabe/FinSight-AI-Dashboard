import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get locale for currency display
 */
function getLocaleForCurrency(currency: string): string {
  const localeMap: Record<string, string> = {
    ILS: 'he-IL',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    CNY: 'zh-CN',
    INR: 'en-IN',
    CAD: 'en-CA',
    AUD: 'en-AU',
    CHF: 'de-CH',
    USD: 'en-US',
  };
  return localeMap[currency?.toUpperCase()] || 'en-US';
}

/**
 * Format currency values with proper locale based on currency
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  const currencyCode = currency?.toUpperCase() || 'USD';
  const locale = getLocaleForCurrency(currencyCode);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
  }).format(amount);
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currency: string): string {
  const symbolMap: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    ILS: '₪',
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF',
  };
  return symbolMap[currency?.toUpperCase()] || currency || '$';
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
