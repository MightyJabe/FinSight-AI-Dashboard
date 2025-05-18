interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export function LoadingSpinner({ message = 'Loading...', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`} role="status">
      <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      <span className="text-gray-500">{message}</span>
    </div>
  );
}
