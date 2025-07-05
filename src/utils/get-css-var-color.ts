// Utility to get a CSS variable color as an rgb string for use in Chart.js
/**
 *
 */
export function getCssVarColor(variable: string): string {
  if (typeof window === 'undefined') return '';
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value ? `rgb(${value})` : '';
}
