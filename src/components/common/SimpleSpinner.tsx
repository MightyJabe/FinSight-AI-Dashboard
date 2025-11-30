import { memo } from 'react';

interface SimpleSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SimpleSpinner = memo(function SimpleSpinner({
  size = 'md',
  className = '',
}: SimpleSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${sizeClasses[size]} ${className}`}
    />
  );
});
