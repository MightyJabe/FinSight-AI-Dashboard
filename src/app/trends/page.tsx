'use client';

import { AlertCircle, BarChart3, Calendar, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import React from 'react';

import { cn } from '@/lib/utils';

const SpendingTrends = dynamic(() => import('@/components/analytics/SpendingTrends'), {
  loading: () => <div className="animate-pulse bg-secondary h-96 rounded-2xl" />,
  ssr: false,
});

export default function TrendsPage() {
  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="mb-10 animate-in">
          <div className="text-center">
            <p className="text-muted-foreground text-sm font-medium mb-1">Financial Analysis</p>
            <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
              Spending Trends & Patterns
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Discover insights in your spending behavior with AI-powered trend analysis. Identify
              patterns, seasonal changes, and unusual spending activities.
            </p>
          </div>
        </header>

        {/* Feature Cards Hero */}
        <section className="mb-8 animate-in delay-75">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-900 dark:to-black p-6 lg:p-8">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/2 -right-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-1/2 -left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            </div>

            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Pattern Recognition</p>
                  <p className="text-neutral-400 text-sm">Identify spending patterns</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Category Analysis</p>
                  <p className="text-neutral-400 text-sm">Break down by categories</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Seasonal Insights</p>
                  <p className="text-neutral-400 text-sm">Seasonal spending habits</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Anomaly Detection</p>
                  <p className="text-neutral-400 text-sm">Spot unusual activity</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Analysis Types */}
        <section className="mb-8 animate-in delay-100">
          <div className="rounded-2xl bg-card border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Available Analysis Types</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Choose from different analysis methods to gain insights into your spending patterns
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: '📊', title: 'Category Analysis', desc: 'See which categories consume most of your budget and identify opportunities for savings.' },
                { icon: '📈', title: 'Monthly Trends', desc: 'Track how your spending changes month over month with percentage change indicators.' },
                { icon: '📅', title: 'Weekly Patterns', desc: 'Discover weekly spending patterns and identify high-spending periods.' },
                { icon: '🌅', title: 'Daily Habits', desc: 'Analyze daily spending habits and find patterns in your routine expenses.' },
                { icon: '🍂', title: 'Seasonal Analysis', desc: 'Understand how your spending varies across different seasons throughout the year.' },
                { icon: '🚨', title: 'Anomaly Detection', desc: 'Identify unusual spending days that deviate significantly from your normal patterns.' },
              ].map((item) => (
                <div
                  key={item.title}
                  className={cn(
                    'p-4 rounded-xl border border-border bg-secondary/30',
                    'hover:bg-secondary/50 transition-colors'
                  )}
                >
                  <h4 className="font-semibold text-foreground mb-2">{item.icon} {item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Trends Component */}
        <section className="mb-8 animate-in delay-150">
          <SpendingTrends />
        </section>

        {/* Tips Section */}
        <section className="animate-in delay-200">
          <div className="rounded-2xl bg-card border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Tips for Better Financial Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-sm">💡</span>
                  Analysis Tips
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Use longer timeframes (6+ months) for more accurate trend analysis</li>
                  <li>• Compare seasonal patterns year-over-year for better insights</li>
                  <li>• Focus on category analysis to identify your biggest spending areas</li>
                  <li>• Review anomalies to understand one-time vs recurring expenses</li>
                  <li>• Enable projections to plan for future spending</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-sm">🎯</span>
                  Action Items
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Set spending limits for your top expense categories</li>
                  <li>• Create alerts for unusual spending patterns</li>
                  <li>• Review seasonal trends to budget for holidays and events</li>
                  <li>• Use insights to adjust your monthly budget allocations</li>
                  <li>• Track improvement by comparing trends over time</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
