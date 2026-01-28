/**
 * Centralized color constants for the application
 * These colors map to Tailwind CSS color utilities or CSS custom properties
 */

/**
 * Transaction category colors
 * Used across spending analysis, charts, and category breakdowns
 */
export const CATEGORY_COLORS = {
  // Expenses
  Housing: 'blue-500',
  Utilities: 'purple-500',
  Groceries: 'green-500',
  Transportation: 'amber-500',
  Healthcare: 'red-500',
  Insurance: 'indigo-500',
  'Debt Payments': 'red-600',
  'Dining Out': 'orange-500',
  Entertainment: 'pink-500',
  Shopping: 'purple-500',
  Travel: 'cyan-500',
  'Fitness & Health': 'lime-500',
  Education: 'indigo-500',
  'Personal Care': 'pink-400',
  Savings: 'emerald-600',
  Investments: 'teal-600',
  Transfers: 'slate-500',
  'Bank Fees': 'red-600',
  'Gifts & Donations': 'amber-500',
  'Business Expenses': 'violet-600',
  Taxes: 'red-500',
  Uncategorized: 'slate-400',
  // Income
  Salary: 'green-500',
  'Freelance Income': 'cyan-500',
  'Investment Returns': 'emerald-600',
  'Rental Income': 'teal-600',
  'Business Income': 'violet-600',
  'Government Benefits': 'indigo-500',
  'Gifts Received': 'amber-500',
  'Other Income': 'purple-500',
} as const;

/**
 * Tailwind color name to hex mapping
 * Used for APIs and libraries that require hex values
 */
const TAILWIND_COLOR_MAP = {
  'blue-500': '#3B82F6',
  'purple-500': '#8B5CF6',
  'green-500': '#10B981',
  'amber-500': '#F59E0B',
  'red-500': '#EF4444',
  'red-600': '#DC2626',
  'indigo-500': '#6366F1',
  'orange-500': '#F97316',
  'pink-500': '#EC4899',
  'pink-400': '#F472B6',
  'cyan-500': '#06B6D4',
  'lime-500': '#84CC16',
  'emerald-600': '#059669',
  'teal-600': '#0D9488',
  'teal-500': '#14B8A6',
  'slate-500': '#64748B',
  'slate-400': '#94A3B8',
  'violet-600': '#7C3AED',
} as const;

/**
 * Convert category name to Tailwind hex color
 * Falls back to slate-400 if category not found
 */
export function getCategoryHexColor(category: string): string {
  const colorName = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || 'slate-400';
  return TAILWIND_COLOR_MAP[colorName as keyof typeof TAILWIND_COLOR_MAP] || TAILWIND_COLOR_MAP['slate-400'];
}

/**
 * Semantic color names for financial data
 */
export const FINANCIAL_COLORS = {
  gain: {
    hex: '#3B82F6',
    rgb: 'rgb(59, 130, 246)',
    rgba: (alpha: number) => `rgba(59, 130, 246, ${alpha})`,
    tailwind: 'blue-500',
  },
  loss: {
    hex: '#EC4899',
    rgb: 'rgb(236, 72, 153)',
    rgba: (alpha: number) => `rgba(236, 72, 153, ${alpha})`,
    tailwind: 'pink-500',
  },
  positive: {
    hex: '#10B981',
    rgb: 'rgb(16, 185, 129)',
    rgba: (alpha: number) => `rgba(16, 185, 129, ${alpha})`,
    tailwind: 'emerald-500',
  },
  negative: {
    hex: '#EF4444',
    rgb: 'rgb(239, 68, 68)',
    rgba: (alpha: number) => `rgba(239, 68, 68, ${alpha})`,
    tailwind: 'red-500',
  },
} as const;

/**
 * Grid pattern colors for page backgrounds
 * Uses CSS custom properties for theme support
 */
export const GRID_PATTERNS = {
  subtle: 'bg-[linear-gradient(to_right,rgb(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem]',
  verySubtle: 'bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem]',
  default: 'bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]',
} as const;
