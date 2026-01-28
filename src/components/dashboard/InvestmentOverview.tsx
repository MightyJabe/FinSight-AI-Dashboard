'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiArrowRight, FiDollarSign, FiTrendingDown, FiTrendingUp } from 'react-icons/fi';

import type { PlatformSummary } from '@/types/platform';
import { formatCurrency } from '@/utils/format';

export default function InvestmentOverview() {
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const response = await fetch('/api/platforms');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch platforms');
      }

      setSummary(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platforms');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card-strong rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl"></div>
            <div className="h-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl w-5/6"></div>
            <div className="h-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return null;
  }

  const isPositive = summary.totalProfit >= 0;
  const topPlatforms = [...summary.platforms]
    .sort((a, b) => b.currentBalance - a.currentBalance)
    .slice(0, 3);

  return (
    <div className="glass-card-strong rounded-2xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold gradient-text">
            Investment Platforms
          </h2>
          <Link
            href="/investments"
            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors group"
          >
            <span>View All</span>
            <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center backdrop-blur-sm">
                <FiDollarSign className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Total Balance</span>
            </div>
            <p className="text-2xl font-bold gradient-text tabular-nums">
              {formatCurrency(summary.totalBalance)}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              {summary.platformCount} platforms
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm border ${
                isPositive
                  ? 'bg-blue-500/20 border-blue-400/30'
                  : 'bg-pink-500/20 border-pink-400/30'
              }`}>
                {isPositive ? (
                  <FiTrendingUp className="w-4 h-4 text-blue-400" />
                ) : (
                  <FiTrendingDown className="w-4 h-4 text-pink-400" />
                )}
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Profit/Loss</span>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${isPositive ? 'text-blue-400' : 'text-pink-400'}`}>
              {isPositive ? '+' : ''}
              {formatCurrency(summary.totalProfit)}
            </p>
            <p className={`text-xs font-semibold mt-1.5 tabular-nums ${isPositive ? 'text-blue-400' : 'text-pink-400'}`}>
              {isPositive ? '+' : ''}
              {summary.totalProfitPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {topPlatforms.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
              Top Platforms
            </h3>
            <div className="space-y-3">
              {topPlatforms.map(platform => {
                const returnPercent = platform.netProfitPercent;
                const isPlatformPositive = returnPercent >= 0;

                return (
                  <div
                    key={platform.id}
                    className="flex items-center justify-between py-3 border-b border-white/10 last:border-0 hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">
                        {platform.name}
                      </p>
                      <p className="text-xs text-blue-400 font-semibold mt-0.5">
                        {platform.currency}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground tabular-nums">
                        {formatCurrency(platform.currentBalance)}
                      </p>
                      <p
                        className={`text-xs font-semibold tabular-nums ${isPlatformPositive ? 'text-blue-400' : 'text-pink-400'}`}
                      >
                        {isPlatformPositive ? '+' : ''}
                        {returnPercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {summary.platforms.length === 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 backdrop-blur-sm mb-4">
              <FiDollarSign className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-sm text-muted-foreground mb-4 font-medium">
              No platforms tracked yet
            </p>
            <Link
              href="/investments"
              className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors group"
            >
              <span>Add your first platform</span>
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
