import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

import { Button } from './Button';
import { Card } from './Card';

const emptyStateVariants = cva('flex flex-col items-center justify-center py-12 text-center', {
  variants: {
    variant: {
      default: '',
      card: 'rounded-lg',
      bordered: 'rounded-lg border-2 border-dashed border-border',
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
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
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
