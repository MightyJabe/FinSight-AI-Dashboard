import { cva } from 'class-variance-authority';

/**
 * Card component variants
 * Used for cards, panels, and container elements throughout the application
 */
export const cardVariants = cva(
  'rounded-2xl text-card-foreground transition-all',
  {
    variants: {
      variant: {
        default: 'glass-card',
        glass: 'glass-card-strong',
        elevated: 'glass-card-strong shadow-lg hover:shadow-xl card-hover',
        outline: 'glass-card border-2 border-blue-500/30',
        flat: 'bg-card/50 backdrop-blur-sm border-0 shadow-none',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'elevated',
        interactive: true,
        class: 'hover:shadow-2xl',
      },
      {
        variant: 'glass',
        interactive: true,
        class: 'hover:bg-card/90',
      },
    ],
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      interactive: false,
    },
  }
);

/**
 * Heading component variants with fluid typography
 * Uses clamp() for smooth responsive scaling from 375px to 2560px
 * Headings automatically scale without breakpoints for optimal readability
 */
export const headingVariants = cva(
  'font-display tracking-tight',
  {
    variants: {
      size: {
        h1: 'text-fluid-6xl',
        h2: 'text-fluid-5xl',
        h3: 'text-fluid-4xl',
        h4: 'text-fluid-3xl',
        h5: 'text-fluid-2xl',
        h6: 'text-fluid-xl',
      },
      color: {
        default: 'text-foreground',
        muted: 'text-muted-foreground',
        primary: 'text-primary',
        accent: 'text-accent-foreground',
      },
      weight: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
      },
    },
    defaultVariants: {
      size: 'h2',
      color: 'default',
      weight: 'bold',
    },
  }
);

/**
 * Text component variants with fluid and fixed sizing options
 * Includes both fluid (clamp-based) and fixed sizes for flexibility
 */
export const textVariants = cva(
  '',
  {
    variants: {
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
        base: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
        '2xl': 'text-2xl',
        // Fluid sizes for dynamic scaling
        'fluid-xs': 'text-fluid-xs',
        'fluid-sm': 'text-fluid-sm',
        'fluid-base': 'text-fluid-base',
        'fluid-lg': 'text-fluid-lg',
        'fluid-xl': 'text-fluid-xl',
      },
      color: {
        default: 'text-foreground',
        muted: 'text-muted-foreground',
        primary: 'text-primary',
        secondary: 'text-secondary-foreground',
        accent: 'text-accent-foreground',
        destructive: 'text-destructive',
        success: 'text-green-600 dark:text-green-400',
      },
      weight: {
        light: 'font-light',
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
      },
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      },
    },
    defaultVariants: {
      size: 'base',
      color: 'default',
      weight: 'normal',
      align: 'left',
    },
  }
);

/**
 * Spacing variants
 * Consistent padding utilities for components
 */
export const spacingVariants = cva(
  '',
  {
    variants: {
      p: {
        none: 'p-0',
        xs: 'p-1',
        sm: 'p-2',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
        '2xl': 'p-12',
      },
      px: {
        none: 'px-0',
        xs: 'px-1',
        sm: 'px-2',
        md: 'px-4',
        lg: 'px-6',
        xl: 'px-8',
        '2xl': 'px-12',
      },
      py: {
        none: 'py-0',
        xs: 'py-1',
        sm: 'py-2',
        md: 'py-4',
        lg: 'py-6',
        xl: 'py-8',
        '2xl': 'py-12',
      },
      m: {
        none: 'm-0',
        xs: 'm-1',
        sm: 'm-2',
        md: 'm-4',
        lg: 'm-6',
        xl: 'm-8',
        '2xl': 'm-12',
      },
      gap: {
        none: 'gap-0',
        xs: 'gap-1',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
        '2xl': 'gap-12',
      },
    },
  }
);

/**
 * Badge component variants
 * Used for status indicators, tags, and labels
 */
export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-0.5',
        lg: 'text-base px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

/**
 * Container variants
 * Used for page layout containers
 */
export const containerVariants = cva(
  'mx-auto w-full',
  {
    variants: {
      size: {
        sm: 'max-w-screen-sm',
        md: 'max-w-screen-md',
        lg: 'max-w-screen-lg',
        xl: 'max-w-screen-xl',
        '2xl': 'max-w-screen-2xl',
        full: 'max-w-full',
      },
      padding: {
        none: 'px-0',
        sm: 'px-4',
        md: 'px-6',
        lg: 'px-8',
      },
    },
    defaultVariants: {
      size: 'xl',
      padding: 'md',
    },
  }
);
