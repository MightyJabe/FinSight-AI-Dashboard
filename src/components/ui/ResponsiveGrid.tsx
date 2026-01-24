import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Responsive grid using CSS Grid auto-fill and minmax()
 * Automatically adjusts columns based on available space without media queries
 */
const responsiveGridVariants = cva('grid w-full', {
  variants: {
    // Minimum column width - grid will fit as many columns as possible
    minColumnWidth: {
      xs: 'grid-cols-[repeat(auto-fill,minmax(min(100%,12rem),1fr))]',
      sm: 'grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))]',
      md: 'grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))]',
      lg: 'grid-cols-[repeat(auto-fill,minmax(min(100%,24rem),1fr))]',
      xl: 'grid-cols-[repeat(auto-fill,minmax(min(100%,28rem),1fr))]',
      '2xl': 'grid-cols-[repeat(auto-fill,minmax(min(100%,32rem),1fr))]',
    },
    // Gap between grid items
    gap: {
      none: 'gap-0',
      xs: 'gap-2',
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      '2xl': 'gap-12',
    },
    // Alignment options
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    },
    justify: {
      start: 'justify-items-start',
      center: 'justify-items-center',
      end: 'justify-items-end',
      stretch: 'justify-items-stretch',
    },
  },
  defaultVariants: {
    minColumnWidth: 'md',
    gap: 'lg',
    align: 'stretch',
    justify: 'stretch',
  },
});

export interface ResponsiveGridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof responsiveGridVariants> {
  /**
   * Custom min-max column configuration
   * Example: "minmax(300px, 1fr)" for 300px minimum columns
   */
  customMinMax?: string;
}

/**
 * ResponsiveGrid component
 *
 * A flexible grid layout that automatically adjusts the number of columns
 * based on available space using CSS Grid's auto-fill and minmax().
 *
 * @example
 * ```tsx
 * // Basic usage - creates columns that are at least 20rem wide
 * <ResponsiveGrid>
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </ResponsiveGrid>
 *
 * // Custom minimum width - smaller cards
 * <ResponsiveGrid minColumnWidth="sm" gap="sm">
 *   <StatCard />
 *   <StatCard />
 *   <StatCard />
 * </ResponsiveGrid>
 *
 * // Custom minmax for precise control
 * <ResponsiveGrid customMinMax="minmax(350px, 1fr)" gap="xl">
 *   <DashboardCard />
 *   <DashboardCard />
 * </ResponsiveGrid>
 * ```
 */
export const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ className, minColumnWidth, gap, align, justify, customMinMax, style, ...props }, ref) => {
    // If customMinMax is provided, use it directly
    const gridStyle = customMinMax
      ? {
          ...style,
          gridTemplateColumns: `repeat(auto-fill, ${customMinMax})`,
        }
      : style;

    return (
      <div
        ref={ref}
        className={cn(
          responsiveGridVariants({
            minColumnWidth: customMinMax ? undefined : minColumnWidth,
            gap,
            align,
            justify,
          }),
          className
        )}
        style={gridStyle}
        {...props}
      />
    );
  }
);

ResponsiveGrid.displayName = 'ResponsiveGrid';

/**
 * Preset grid configurations for common dashboard patterns
 */
export const gridPresets = {
  /** Dashboard stats grid - 4 columns on ultra-wide, adapts to 3/2/1 */
  stats: {
    minColumnWidth: 'sm' as const,
    gap: 'md' as const,
  },
  /** Card grid - 3 columns on desktop, adapts to 2/1 */
  cards: {
    minColumnWidth: 'md' as const,
    gap: 'lg' as const,
  },
  /** Wide cards - 2 columns max, adapts to 1 */
  wideCards: {
    minColumnWidth: 'xl' as const,
    gap: 'xl' as const,
  },
  /** Compact grid - many small items */
  compact: {
    minColumnWidth: 'xs' as const,
    gap: 'sm' as const,
  },
  /** Accounts grid - optimal for account cards */
  accounts: {
    minColumnWidth: 'lg' as const,
    gap: 'lg' as const,
  },
} as const;

/**
 * PresetGrid component for quick common patterns
 *
 * @example
 * ```tsx
 * <PresetGrid preset="stats">
 *   <StatCard />
 *   <StatCard />
 *   <StatCard />
 *   <StatCard />
 * </PresetGrid>
 * ```
 */
export interface PresetGridProps extends Omit<ResponsiveGridProps, 'minColumnWidth' | 'gap'> {
  preset: keyof typeof gridPresets;
}

export const PresetGrid = React.forwardRef<HTMLDivElement, PresetGridProps>(
  ({ preset, ...props }, ref) => {
    const presetConfig = gridPresets[preset];
    return <ResponsiveGrid ref={ref} {...presetConfig} {...props} />;
  }
);

PresetGrid.displayName = 'PresetGrid';
