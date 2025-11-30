'use client';

import { ArrowRight, Lightbulb } from 'lucide-react';
import Link from 'next/link';

import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState } from '@/components/ui';
import { useProactiveInsights } from '@/hooks/useProactiveInsights';

export function ProactiveInsightsCard() {
  const { insights, isLoading } = useProactiveInsights();
  const newInsights = insights.filter((i: any) => i.status === 'new').slice(0, 3);

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            AI Insights {newInsights.length > 0 && `(${newInsights.length})`}
          </CardTitle>
          <Link href="/insights">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {newInsights.length > 0 ? (
          <div className="space-y-3">
            {newInsights.map((insight: any) => (
              <div
                key={insight.id}
                className={`p-3 rounded-lg border-l-4 ${
                  insight.priority === 'high'
                    ? 'bg-red-50 border-red-500'
                    : insight.priority === 'medium'
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-blue-50 border-blue-500'
                }`}
              >
                <h4 className="font-semibold text-sm text-gray-900">{insight.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{insight.content.substring(0, 100)}...</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Lightbulb className="w-6 h-6" />}
            title="No new insights"
            description="Check back later for AI-generated financial insights"
          />
        )}
      </CardContent>
    </Card>
  );
}
