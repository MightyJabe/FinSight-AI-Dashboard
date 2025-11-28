'use client';

import { AlertCircle, BarChart3, Calendar, TrendingUp } from 'lucide-react';
import React from 'react';

import SpendingTrends from '@/components/analytics/SpendingTrends';

export default function TrendsPage() {
  return (
    <div className="space-y-8">
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
        <div className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                Pattern Recognition
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Identify spending patterns over time
              </p>
            </div>
          </div>
        </div>

        <div className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Category Analysis
              </h3>
              <p className="text-sm text-green-600 dark:text-green-300">
                Break down spending by categories
              </p>
            </div>
          </div>
        </div>

        <div className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="font-semibold text-purple-800 dark:text-purple-200">
                Seasonal Insights
              </h3>
              <p className="text-sm text-purple-600 dark:text-purple-300">
                Understand seasonal spending habits
              </p>
            </div>
          </div>
        </div>

        <div className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-orange-600" />
            <div>
              <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                Anomaly Detection
              </h3>
              <p className="text-sm text-orange-600 dark:text-orange-300">
                Spot unusual spending activities
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Types Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Available Analysis Types</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Choose from different analysis methods to gain insights into your spending patterns
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">📊 Category Analysis</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              See which categories consume most of your budget and identify opportunities for
              savings.
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">📈 Monthly Trends</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Track how your spending changes month over month with percentage change indicators.
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">📅 Weekly Patterns</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Discover weekly spending patterns and identify high-spending periods.
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">🌅 Daily Habits</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Analyze daily spending habits and find patterns in your routine expenses.
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">🍂 Seasonal Analysis</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Understand how your spending varies across different seasons throughout the year.
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">🚨 Anomaly Detection</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Identify unusual spending days that deviate significantly from your normal patterns.
            </p>
          </div>
        </div>
      </div>

      {/* Main Trends Component */}
      <SpendingTrends />

      {/* Tips and Best Practices */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Tips for Better Financial Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3">💡 Analysis Tips</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• Use longer timeframes (6+ months) for more accurate trend analysis</li>
              <li>• Compare seasonal patterns year-over-year for better insights</li>
              <li>• Focus on category analysis to identify your biggest spending areas</li>
              <li>• Review anomalies to understand one-time vs recurring expenses</li>
              <li>• Enable projections to plan for future spending</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">🎯 Action Items</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• Set spending limits for your top expense categories</li>
              <li>• Create alerts for unusual spending patterns</li>
              <li>• Review seasonal trends to budget for holidays and events</li>
              <li>• Use insights to adjust your monthly budget allocations</li>
              <li>• Track improvement by comparing trends over time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
