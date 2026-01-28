/**
 * Chart color palettes for data visualization
 * Provides consistent color schemes across all charts
 */

/**
 * Primary chart color palette
 * Used for pie charts, bar charts, and multi-series data
 */
export const CHART_COLORS = {
  primary: [
    '#3B82F6', // Blue-500
    '#8B5CF6', // Purple-500
    '#EC4899', // Pink-500
    '#6366F1', // Indigo-500
    '#A78BFA', // Violet-400
    '#F472B6', // Pink-400
    '#60A5FA', // Blue-400
    '#C084FC', // Purple-400
    '#818CF8', // Indigo-400
    '#93C5FD', // Blue-300
  ],
  vibrant: [
    '#F59E0B', // Amber-500
    '#10B981', // Emerald-500
    '#06B6D4', // Cyan-500
    '#EF4444', // Red-500
    '#8B5CF6', // Purple-500
    '#F97316', // Orange-500
    '#84CC16', // Lime-500
    '#EC4899', // Pink-500
  ],
} as const;

/**
 * Chart colors with alpha for backgrounds and fills
 */
export const CHART_COLORS_WITH_ALPHA = {
  /**
   * Convert a hex color to rgba with specified alpha
   */
  toRgba: (hex: string, alpha: number): string => {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  /**
   * Pre-defined background colors with 20% opacity
   */
  backgrounds: {
    blue: 'rgba(59, 130, 246, 0.2)',
    purple: 'rgba(139, 92, 246, 0.2)',
    emerald: 'rgba(16, 185, 129, 0.2)',
    amber: 'rgba(245, 158, 11, 0.2)',
  },

  /**
   * Pre-defined border colors with 80% opacity
   */
  borders: {
    blue: 'rgba(59, 130, 246, 0.8)',
    purple: 'rgba(139, 92, 246, 0.8)',
    emerald: 'rgba(16, 185, 129, 0.8)',
    amber: 'rgba(245, 158, 11, 0.8)',
  },
} as const;

/**
 * Investment chart specific colors
 */
export const INVESTMENT_CHART_COLORS = {
  /**
   * Colors for different asset types
   */
  assetTypes: {
    stocks: '#3B82F6',      // Blue
    bonds: '#10B981',       // Emerald
    crypto: '#F59E0B',      // Amber
    realEstate: '#8B5CF6',  // Purple
    cash: '#6B7280',        // Gray
    commodities: '#EF4444', // Red
  },

  /**
   * Gain/loss chart colors
   */
  performance: {
    gain: {
      bar: 'rgba(59, 130, 246, 0.8)',
      hover: 'rgba(96, 165, 250, 1)',
    },
    loss: {
      bar: 'rgba(236, 72, 153, 0.8)',
      hover: 'rgba(244, 114, 182, 1)',
    },
  },
} as const;

/**
 * Spending trends chart colors
 */
export const SPENDING_CHART_COLORS = {
  income: {
    background: 'rgba(16, 185, 129, 0.2)',
    border: 'rgba(16, 185, 129, 0.8)',
  },
  expenses: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: 'rgba(239, 68, 68, 0.8)',
  },
  netSavings: {
    background: 'rgba(59, 130, 246, 0.2)',
    border: 'rgba(59, 130, 246, 0.8)',
  },
} as const;
