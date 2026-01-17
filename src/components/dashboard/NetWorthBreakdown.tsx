'use client';

import {
  ChevronDown,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { memo, useState } from 'react';

import { cn, formatCurrency } from '@/lib/utils';

import { AssetAllocationChart } from './AssetAllocationChart';

interface NetWorthBreakdownProps {
  totalAssets: number;
  totalLiabilities: number;
  assetsByType: Record<string, number>;
  liabilitiesByType: Record<string, number>;
  currency?: string;
}

const TYPE_LABELS: Record<string, string> = {
  checking: 'Checking',
  savings: 'Savings',
  investment: 'Investments',
  brokerage: 'Brokerage',
  retirement: 'Retirement',
  pension: 'Pension',
  crypto: 'Cryptocurrency',
  real_estate: 'Real Estate',
  vehicle: 'Vehicles',
  other_asset: 'Other Assets',
  credit: 'Credit Cards',
  credit_card: 'Credit Cards',
  loan: 'Loans',
  mortgage: 'Mortgage',
  student_loan: 'Student Loans',
  auto_loan: 'Auto Loans',
  personal_loan: 'Personal Loans',
  other_liability: 'Other Liabilities',
  // Additional mapping for display names
  'Cash & Checking': 'Cash & Checking',
  'Investments': 'Investments',
  'Crypto': 'Cryptocurrency',
  'Real Estate': 'Real Estate',
  'Pension': 'Pension',
};

function formatTypeName(type: string): string {
  return (
    TYPE_LABELS[type.toLowerCase()] ||
    TYPE_LABELS[type] ||
    type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')
  );
}

// Asset type colors for progress bars
const TYPE_COLORS: Record<string, string> = {
  checking: 'bg-blue-500',
  savings: 'bg-emerald-500',
  investment: 'bg-violet-500',
  brokerage: 'bg-violet-500',
  retirement: 'bg-teal-500',
  pension: 'bg-cyan-500',
  crypto: 'bg-amber-500',
  real_estate: 'bg-pink-500',
  vehicle: 'bg-slate-500',
  other_asset: 'bg-gray-500',
  'Cash & Checking': 'bg-blue-500',
  'Investments': 'bg-violet-500',
  'Crypto': 'bg-amber-500',
  'Real Estate': 'bg-pink-500',
  'Pension': 'bg-cyan-500',
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] || TYPE_COLORS[type.toLowerCase()] || 'bg-gray-500';
}

function NetWorthBreakdownComponent({
  totalAssets,
  totalLiabilities,
  assetsByType,
  liabilitiesByType,
  currency = 'USD',
}: NetWorthBreakdownProps) {
  const [expandedSection, setExpandedSection] = useState<'assets' | 'liabilities' | null>(null);

  const sortedAssets = Object.entries(assetsByType).sort(([, a], [, b]) => b - a);
  const sortedLiabilities = Object.entries(liabilitiesByType).sort(([, a], [, b]) => b - a);

  const netWorth = totalAssets - totalLiabilities;
  const assetsPercentage = totalAssets + totalLiabilities > 0
    ? (totalAssets / (totalAssets + totalLiabilities)) * 100
    : 100;

  // Prepare data for donut chart
  const chartData = sortedAssets.map(([name, value]) => ({
    name: formatTypeName(name),
    value,
    color: getTypeColor(name),
  }));

  return (
    <div className="space-y-6">
      {/* Assets vs Liabilities Visual Bar */}
      <div className="p-6 lg:p-8 rounded-2xl bg-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Balance Sheet</h3>
          <div className="flex items-center gap-2">
            {netWorth >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-500" />
            )}
            <span
              className={cn(
                'text-sm font-semibold',
                netWorth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              )}
            >
              Net: {formatCurrency(netWorth, currency)}
            </span>
          </div>
        </div>

        {/* Visual bar showing assets vs liabilities proportion */}
        <div className="relative h-4 bg-secondary rounded-full overflow-hidden mb-6">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
            style={{ width: `${assetsPercentage}%` }}
          />
          {totalLiabilities > 0 && (
            <div
              className="absolute inset-y-0 right-0 bg-gradient-to-l from-rose-500 to-rose-400 transition-all duration-700 ease-out"
              style={{ width: `${100 - assetsPercentage}%` }}
            />
          )}
          {/* Center marker */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-6 bg-background rounded-full shadow" />
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Assets Card */}
          <div
            className={cn(
              'p-5 rounded-xl border transition-all duration-300',
              expandedSection === 'assets'
                ? 'bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/20'
                : 'bg-secondary/30 border-transparent hover:border-emerald-500/20'
            )}
          >
            <button
              onClick={() => setExpandedSection(expandedSection === 'assets' ? null : 'assets')}
              className="w-full flex items-center justify-between text-left"
              aria-expanded={expandedSection === 'assets'}
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <p className="text-sm text-muted-foreground font-medium">Total Assets</p>
                </div>
                <p className="text-2xl lg:text-3xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(totalAssets, currency)}
                </p>
              </div>
              <div
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  expandedSection === 'assets' ? 'bg-emerald-500/20' : 'bg-emerald-500/10'
                )}
              >
                {expandedSection === 'assets' ? (
                  <ChevronDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
            </button>

            {/* Expanded asset details with progress bars */}
            <div
              className={cn(
                'overflow-hidden transition-all duration-300',
                expandedSection === 'assets' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
                {sortedAssets.length > 0 ? (
                  sortedAssets.map(([type, amount], index) => {
                    const percentage = totalAssets > 0 ? (amount / totalAssets) * 100 : 0;
                    return (
                      <div
                        key={type}
                        className="group animate-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium">{formatTypeName(type)}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs tabular-nums">
                              {percentage.toFixed(1)}%
                            </span>
                            <span className="font-semibold tabular-nums">
                              {formatCurrency(amount, currency)}
                            </span>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500 ease-out',
                              getTypeColor(type)
                            )}
                            style={{
                              width: `${percentage}%`,
                              transitionDelay: `${index * 50}ms`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No assets recorded</p>
                )}
              </div>
            </div>
          </div>

          {/* Liabilities Card */}
          <div
            className={cn(
              'p-5 rounded-xl border transition-all duration-300',
              expandedSection === 'liabilities'
                ? 'bg-rose-500/5 border-rose-500/30 ring-1 ring-rose-500/20'
                : 'bg-secondary/30 border-transparent hover:border-rose-500/20'
            )}
          >
            <button
              onClick={() =>
                setExpandedSection(expandedSection === 'liabilities' ? null : 'liabilities')
              }
              className="w-full flex items-center justify-between text-left"
              aria-expanded={expandedSection === 'liabilities'}
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <p className="text-sm text-muted-foreground font-medium">Total Liabilities</p>
                </div>
                <p className="text-2xl lg:text-3xl font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                  {formatCurrency(totalLiabilities, currency)}
                </p>
              </div>
              <div
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  expandedSection === 'liabilities' ? 'bg-rose-500/20' : 'bg-rose-500/10'
                )}
              >
                {expandedSection === 'liabilities' ? (
                  <ChevronDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                )}
              </div>
            </button>

            {/* Expanded liability details with progress bars */}
            <div
              className={cn(
                'overflow-hidden transition-all duration-300',
                expandedSection === 'liabilities' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
                {sortedLiabilities.length > 0 ? (
                  sortedLiabilities.map(([type, amount], index) => {
                    const percentage = totalLiabilities > 0 ? (amount / totalLiabilities) * 100 : 0;
                    return (
                      <div
                        key={type}
                        className="group animate-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium">{formatTypeName(type)}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs tabular-nums">
                              {percentage.toFixed(1)}%
                            </span>
                            <span className="font-semibold tabular-nums">
                              {formatCurrency(amount, currency)}
                            </span>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${percentage}%`,
                              transitionDelay: `${index * 50}ms`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      Debt-free!
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">No liabilities recorded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Allocation Chart - Only show if we have asset data */}
      {sortedAssets.length > 0 && (
        <div className="p-6 lg:p-8 rounded-2xl bg-card border border-border">
          <h3 className="text-lg font-semibold mb-6">Asset Allocation</h3>
          <AssetAllocationChart data={chartData} total={totalAssets} currency={currency} size="md" />
        </div>
      )}
    </div>
  );
}

export const NetWorthBreakdown = memo(NetWorthBreakdownComponent);
