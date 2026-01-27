export function LoadingSpinner({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-muted border-t-primary ${className}`}
    />
  );
}
