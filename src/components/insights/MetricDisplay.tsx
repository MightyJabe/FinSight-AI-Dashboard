'use client';

interface MetricDisplayProps {
  title: string;
  value: number | string | null | undefined;
  isLoading?: boolean;
  className?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}

/**
 *
 */
export default function MetricDisplay({
  title,
  value,
  isLoading = false,
  className = '',
  valuePrefix = '',
  valueSuffix = '',
}: MetricDisplayProps) {
  const displayValue =
    value !== null && value !== undefined
      ? `${valuePrefix}${typeof value === 'number' ? value.toLocaleString() : value}${valueSuffix}`
      : 'N/A';

  return (
    <div className={`bg-white p-6 rounded-xl shadow-lg ${className}`}>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">{title}</h2>
      {isLoading ? (
        <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4"></div>
      ) : (
        <p className="text-3xl font-bold text-gray-800">{displayValue}</p>
      )}
    </div>
  );
}
