import React, { useId } from 'react';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  gradientStart?: string;
  gradientEnd?: string;
  nodeColor?: string;
  accentColor?: string;
}

/**
 *
 */
export function Logo({
  width = 200,
  height = 200,
  className = '',
  gradientStart = 'rgb(37 99 235)', // Tailwind primary.DEFAULT
  gradientEnd = 'rgb(14 165 233)', // Tailwind accent.DEFAULT
  nodeColor = 'rgb(56 189 248)', // Tailwind logoNode
  accentColor = 'rgb(14 165 233)', // Tailwind accent.DEFAULT
}: LogoProps) {
  // Generate a unique suffix so IDs never clash
  const uid = useId();
  const gradId = `logoGrad-${uid}`;
  const nodeGradId = `nodeGrad-${uid}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      role="img"
      aria-labelledby="logoTitle logoDesc"
      className={className}
    >
      <title id="logoTitle">FinSight AI Logo</title>
      <desc id="logoDesc">
        An ascending trend line with data nodes, representing finance and AI.
      </desc>

      {/* 1) DEFINITIONS (must come first) */}
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="200" y2="200">
          <stop offset="0%" stopColor={gradientStart} />
          <stop offset="100%" stopColor={gradientEnd} />
        </linearGradient>
        <linearGradient id={nodeGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={nodeColor} />
          <stop offset="100%" stopColor={gradientStart} />
        </linearGradient>
      </defs>

      {/* 2) BACKGROUND CIRCLE */}
      <circle cx="100" cy="100" r="90" fill={`url(#${gradId})`} opacity="0.15" />

      {/* 3) TREND LINE */}
      <polyline
        points="40,140 80,100 120,120 160,60"
        stroke={`url(#${gradId})`}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 4) DATA NODES */}
      {[
        [80, 100],
        [120, 120],
        [160, 60],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="8"
          fill={`url(#${nodeGradId})`}
          stroke="rgb(255 255 255)"
          strokeWidth="2"
        />
      ))}

      {/* 5) UP-ARROW */}
      <path
        d="M140 40 L160 60 L152 60"
        stroke={accentColor}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
