import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

import { Button } from './button';
import { Card } from './card';

const emptyStateVariants = cva('flex flex-col items-center justify-center py-12 text-center', {
  variants: {
    variant: {
      default: '',
      card: 'rounded-2xl glass-card-strong',
      bordered: 'rounded-2xl border-2 border-dashed border-blue-500/30 glass-card',
    },
    size: {
      sm: 'py-8',
      md: 'py-12',
      lg: 'py-16',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

interface EmptyStateProps extends VariantProps<typeof emptyStateVariants> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  illustration?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  variant,
  size,
  illustration,
}) => {
  const content = (
    <div className={cn(emptyStateVariants({ variant, size }), className)}>
      {illustration && <div className="mb-6">{illustration}</div>}
      {icon && !illustration && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 backdrop-blur-sm">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-bold gradient-text">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  );

  if (variant === 'card') {
    return <Card>{content}</Card>;
  }

  return content;
};
