// Utility for formatting currency values

/**
 *
 */
export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
}

/**
 *
 */
export function formatPercentage(value: number | undefined): string {
  if (value === undefined || isNaN(value)) {
    return '0.0%';
  }
  return `${value.toFixed(1)}%`;
}
