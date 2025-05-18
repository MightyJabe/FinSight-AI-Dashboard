// Utility for mapping categories to consistent colors

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f59e42',
  Groceries: '#22c55e',
  Transport: '#2563eb',
  Salary: '#22d3ee',
  Shopping: '#a855f7',
  Utilities: '#eab308',
  Health: '#f43f5e',
  Entertainment: '#a3e635',
  Investment: '#14b8a6',
  Rent: '#64748b',
  Other: '#64748b',
};

const DEFAULT_COLOR = '#64748b';

export function getCategoryColor(category: string): string {
  if (!category) return DEFAULT_COLOR;
  // Try exact match, then case-insensitive
  return (
    CATEGORY_COLORS[category] ||
    CATEGORY_COLORS[category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()] ||
    DEFAULT_COLOR
  );
}
