export default function TransactionsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="h-10 w-full bg-gray-100 rounded mb-4 animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
