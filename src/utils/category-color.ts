// Utility for mapping categories to consistent colors

const CATEGORY_COLORS: Record<string, string> = {
  Food: 'amber-500',
  Groceries: 'green-500',
  Transport: 'blue-600',
  Salary: 'cyan-400',
  Shopping: 'purple-500',
  Utilities: 'yellow-500',
  Health: 'rose-500',
  Entertainment: 'lime-400',
  Investment: 'teal-500',
  Rent: 'slate-500',
  Other: 'slate-500',
};

const DEFAULT_COLOR = 'slate-500';

/**
 * Returns the Tailwind color class for a given category
 * @param category The category name
 * @returns The Tailwind color class (e.g., 'blue-500')
 */
export function getCategoryColor(category: string): string {
  if (!category) return DEFAULT_COLOR;
  // Try exact match, then case-insensitive
  return (
    CATEGORY_COLORS[category] ||
    CATEGORY_COLORS[category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()] ||
    DEFAULT_COLOR
  );
}
