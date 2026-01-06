'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { cn, formatCurrency } from '@/lib/utils';

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
};

function formatTypeName(type: string): string {
  return TYPE_LABELS[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
}

export function NetWorthBreakdown({
  totalAssets,
  totalLiabilities,
  assetsByType,
  liabilitiesByType,
  currency = 'USD',
}: NetWorthBreakdownProps) {
  const [expandedSection, setExpandedSection] = useState<'assets' | 'liabilities' | null>(null);

  const sortedAssets = Object.entries(assetsByType).sort(([, a], [, b]) => b - a);
  const sortedLiabilities = Object.entries(liabilitiesByType).sort(([, a], [, b]) => b - a);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Assets Card */}
      <div className="p-6 rounded-2xl bg-card border border-border card-hover">
        <button
          onClick={() => setExpandedSection(expandedSection === 'assets' ? null : 'assets')}
          className="w-full flex items-center justify-between text-left"
          aria-expanded={expandedSection === 'assets'}
        >
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Assets</p>
            <p className="text-2xl lg:text-3xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(totalAssets, currency)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10">
            {expandedSection === 'assets' ? (
              <ChevronDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
        </button>

        <div
          className={cn(
            'overflow-hidden transition-all duration-300',
            expandedSection === 'assets' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            {sortedAssets.length > 0 ? (
              sortedAssets.map(([type, amount]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{formatTypeName(type)}</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(amount, currency)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No assets recorded
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Liabilities Card */}
      <div className="p-6 rounded-2xl bg-card border border-border card-hover">
        <button
          onClick={() => setExpandedSection(expandedSection === 'liabilities' ? null : 'liabilities')}
          className="w-full flex items-center justify-between text-left"
          aria-expanded={expandedSection === 'liabilities'}
        >
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Liabilities</p>
            <p className="text-2xl lg:text-3xl font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
              {formatCurrency(totalLiabilities, currency)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-rose-500/10">
            {expandedSection === 'liabilities' ? (
              <ChevronDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            )}
          </div>
        </button>

        <div
          className={cn(
            'overflow-hidden transition-all duration-300',
            expandedSection === 'liabilities' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            {sortedLiabilities.length > 0 ? (
              sortedLiabilities.map(([type, amount]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{formatTypeName(type)}</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(amount, currency)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No liabilities recorded
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
