'use client';

import { memo, useMemo } from 'react';

import { cn, formatCurrency } from '@/lib/utils';

interface AssetCategory {
  name: string;
  value: number;
  color: string;
  gradientFrom?: string;
  gradientTo?: string;
}

interface AssetAllocationChartProps {
  data: AssetCategory[];
  total: number;
  currency?: string;
  showLegend?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Premium color palette for asset types
const ASSET_COLORS: Record<string, { color: string; from: string; to: string }> = {
  'Cash & Checking': { color: '#3B82F6', from: '#60A5FA', to: '#2563EB' },
  'Savings': { color: '#10B981', from: '#34D399', to: '#059669' },
  'Investments': { color: '#8B5CF6', from: '#A78BFA', to: '#7C3AED' },
  'Crypto': { color: '#F59E0B', from: '#FBBF24', to: '#D97706' },
  'Real Estate': { color: '#EC4899', from: '#F472B6', to: '#DB2777' },
  'Pension': { color: '#06B6D4', from: '#22D3EE', to: '#0891B2' },
  'Retirement': { color: '#14B8A6', from: '#2DD4BF', to: '#0D9488' },
  'Other': { color: '#6B7280', from: '#9CA3AF', to: '#4B5563' },
};

function getAssetColor(name: string): { color: string; from: string; to: string } {
  return ASSET_COLORS[name] || ASSET_COLORS['Other'] || { color: '#6B7280', from: '#9CA3AF', to: '#4B5563' };
}

const SIZE_CONFIG = {
  sm: { ring: 160, stroke: 24, inner: 112, fontSize: 'text-lg', labelSize: 'text-xs' },
  md: { ring: 220, stroke: 32, inner: 156, fontSize: 'text-2xl', labelSize: 'text-sm' },
  lg: { ring: 280, stroke: 40, inner: 200, fontSize: 'text-3xl', labelSize: 'text-base' },
};

function AssetAllocationChartComponent({
  data,
  total,
  currency = 'USD',
  showLegend = true,
  size = 'md',
  className,
}: AssetAllocationChartProps) {
  const config = SIZE_CONFIG[size];
  const radius = (config.ring - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = config.ring / 2;

  // Calculate segments
  const segments = useMemo(() => {
    if (total === 0) return [];

    let cumulativePercent = 0;
    return data
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .map(item => {
        const percent = (item.value / total) * 100;
        const colors = getAssetColor(item.name);
        const segment = {
          ...item,
          percent,
          offset: cumulativePercent,
          strokeDasharray: `${(percent / 100) * circumference} ${circumference}`,
          strokeDashoffset: -(cumulativePercent / 100) * circumference,
          color: colors.color,
          gradientFrom: colors.from,
          gradientTo: colors.to,
        };
        cumulativePercent += percent;
        return segment;
      });
  }, [data, total, circumference]);

  // Find largest segment for center display
  const largestSegment = segments[0];

  if (segments.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center', className)}>
        <div
          className="relative rounded-full bg-secondary/50 flex items-center justify-center"
          style={{ width: config.ring, height: config.ring }}
        >
          <div
            className="absolute rounded-full bg-card flex items-center justify-center"
            style={{ width: config.inner, height: config.inner }}
          >
            <p className="text-muted-foreground text-sm">No assets</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col lg:flex-row items-center gap-6 lg:gap-10', className)}>
      {/* Donut Chart */}
      <div className="relative" style={{ width: config.ring, height: config.ring }}>
        {/* SVG Donut */}
        <svg
          width={config.ring}
          height={config.ring}
          viewBox={`0 0 ${config.ring} ${config.ring}`}
          className="transform -rotate-90"
        >
          {/* Definitions for gradients */}
          <defs>
            {segments.map((segment, i) => (
              <linearGradient
                key={`gradient-${i}`}
                id={`segment-gradient-${i}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={segment.gradientFrom} />
                <stop offset="100%" stopColor={segment.gradientTo} />
              </linearGradient>
            ))}
            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.stroke}
            className="text-secondary/30"
          />

          {/* Segments */}
          {segments.map((segment, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={`url(#segment-gradient-${i})`}
              strokeWidth={config.stroke}
              strokeDasharray={segment.strokeDasharray}
              strokeDashoffset={segment.strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              style={{
                filter: segment === largestSegment ? 'url(#glow)' : undefined,
              }}
            />
          ))}
        </svg>

        {/* Center content */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            top: (config.ring - config.inner) / 2,
            left: (config.ring - config.inner) / 2,
            width: config.inner,
            height: config.inner,
          }}
        >
          <div className="text-center">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">
              Total Assets
            </p>
            <p className={cn('font-display font-semibold tracking-tight tabular-nums', config.fontSize)}>
              {formatCurrency(total, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex-1 min-w-0">
          <div className="grid gap-3">
            {segments.map((segment, i) => (
              <div
                key={i}
                className="group flex items-center gap-3 p-2.5 -mx-2.5 rounded-xl hover:bg-secondary/50 transition-colors cursor-default"
              >
                {/* Color indicator with gradient */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-background transition-transform group-hover:scale-125"
                  style={{
                    background: `linear-gradient(135deg, ${segment.gradientFrom}, ${segment.gradientTo})`,
                    boxShadow: `0 0 0 2px var(--tw-ring-offset-color), 0 0 0 4px ${segment.color}`,
                  }}
                />
                {/* Name and percentage */}
                <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                  <span className={cn('truncate text-sm font-medium', config.labelSize)}>
                    {segment.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {segment.percent.toFixed(1)}%
                    </span>
                    <span className={cn('font-semibold tabular-nums whitespace-nowrap', config.labelSize)}>
                      {formatCurrency(segment.value, currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const AssetAllocationChart = memo(AssetAllocationChartComponent);
