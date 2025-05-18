import { Insight } from '@/types/finance';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface AIInsightsProps {
  insights: Insight[] | undefined;
  insightsLoading: boolean;
}

export function AIInsights({ insights, insightsLoading }: AIInsightsProps) {
  if (insightsLoading) {
    return <LoadingSpinner message="Loading insights..." />;
  }

  if (!insights?.length) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">AI Insights</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">{insight.title}</h3>
            <p className="text-gray-600">{insight.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
