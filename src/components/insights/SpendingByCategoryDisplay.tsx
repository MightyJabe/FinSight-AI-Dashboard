'use client';

interface SpendingByCategoryDisplayProps {
  spendingData: Record<string, number>;
  isLoading?: boolean;
}

export default function SpendingByCategoryDisplay({
  spendingData,
  isLoading = false,
}: SpendingByCategoryDisplayProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Spending by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (Object.keys(spendingData).length === 0) {
    return null; // Or a message indicating no spending data
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Spending by Category</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(spendingData).map(([category, amount]) => (
          <div key={category} className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <p className="font-medium text-gray-700 truncate">{category}</p>
            <p className="text-2xl font-semibold text-gray-800">
              ${amount.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 