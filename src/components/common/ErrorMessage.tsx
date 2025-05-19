interface ErrorMessageProps {
  message: string;
  className?: string;
}

/**
 *
 */
export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  return (
    <div
      className={`text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2 my-2 ${className}`}
      role="alert"
    >
      {message}
    </div>
  );
}
