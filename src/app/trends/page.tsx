'use client';

import { AlertCircle, BarChart3, Calendar, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

const SpendingTrends = dynamic(() => import('@/components/analytics/SpendingTrends'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />,
  ssr: false,
});

export default function TrendsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Spending Trends & Patterns
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Discover insights in your spending behavior with AI-powered trend analysis. Identify
            patterns, seasonal changes, and unusual spending activities.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant="elevated" hover className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-800">Pattern Recognition</h3>
                  <p className="text-sm text-blue-600">Identify spending patterns over time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" hover className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent>
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Category Analysis</h3>
                  <p className="text-sm text-green-600">Break down spending by categories</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" hover className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent>
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-purple-800">Seasonal Insights</h3>
                  <p className="text-sm text-purple-600">Understand seasonal spending habits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" hover className="bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-orange-800">Anomaly Detection</h3>
                  <p className="text-sm text-orange-600">Spot unusual spending activities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Available Analysis Types</CardTitle>
            <p className="text-gray-600 mt-2">
              Choose from different analysis methods to gain insights into your spending patterns
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card variant="outline" hover>
                <CardContent>
                  <h4 className="font-semibold mb-2">📊 Category Analysis</h4>
                  <p className="text-sm text-gray-600">
                    See which categories consume most of your budget and identify opportunities for
                    savings.
                  </p>
                </CardContent>
              </Card>

              <Card variant="outline" hover>
                <CardContent>
                  <h4 className="font-semibold mb-2">📈 Monthly Trends</h4>
                  <p className="text-sm text-gray-600">
                    Track how your spending changes month over month with percentage change
                    indicators.
                  </p>
                </CardContent>
              </Card>

              <Card variant="outline" hover>
                <CardContent>
                  <h4 className="font-semibold mb-2">📅 Weekly Patterns</h4>
                  <p className="text-sm text-gray-600">
                    Discover weekly spending patterns and identify high-spending periods.
                  </p>
                </CardContent>
              </Card>

              <Card variant="outline" hover>
                <CardContent>
                  <h4 className="font-semibold mb-2">🌅 Daily Habits</h4>
                  <p className="text-sm text-gray-600">
                    Analyze daily spending habits and find patterns in your routine expenses.
                  </p>
                </CardContent>
              </Card>

              <Card variant="outline" hover>
                <CardContent>
                  <h4 className="font-semibold mb-2">🍂 Seasonal Analysis</h4>
                  <p className="text-sm text-gray-600">
                    Understand how your spending varies across different seasons throughout the
                    year.
                  </p>
                </CardContent>
              </Card>

              <Card variant="outline" hover>
                <CardContent>
                  <h4 className="font-semibold mb-2">🚨 Anomaly Detection</h4>
                  <p className="text-sm text-gray-600">
                    Identify unusual spending days that deviate significantly from your normal
                    patterns.
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Main Trends Component */}
        <SpendingTrends />

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Tips for Better Financial Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">💡 Analysis Tips</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Use longer timeframes (6+ months) for more accurate trend analysis</li>
                  <li>• Compare seasonal patterns year-over-year for better insights</li>
                  <li>• Focus on category analysis to identify your biggest spending areas</li>
                  <li>• Review anomalies to understand one-time vs recurring expenses</li>
                  <li>• Enable projections to plan for future spending</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">🎯 Action Items</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Set spending limits for your top expense categories</li>
                  <li>• Create alerts for unusual spending patterns</li>
                  <li>• Review seasonal trends to budget for holidays and events</li>
                  <li>• Use insights to adjust your monthly budget allocations</li>
                  <li>• Track improvement by comparing trends over time</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
