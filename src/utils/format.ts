// Re-export from lib/utils to maintain compatibility
export { formatCurrency, formatPercentage } from '@/lib/utils';

// Legacy compatibility - these functions are now in lib/utils.ts
export const formatNumber = (num: number) => num.toLocaleString();
export const formatDate = (date: Date | string) => new Date(date).toLocaleDateString();
