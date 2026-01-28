/**
 * Empty State Illustrations
 * SVG illustrations for various empty states throughout the application
 * Designed to match the glassmorphic design system with blue/purple/pink gradients
 */

import React from 'react';

interface IllustrationProps {
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Empty Goals Illustration
 * Target with checkmarks and progress indicators
 */
export function NoGoalsIllustration({ className = '', width = 200, height = 200 }: IllustrationProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      {/* Outer ring */}
      <circle cx="100" cy="100" r="80" stroke="url(#goalGradient)" strokeWidth="3" fill="none" opacity="0.3" />
      <circle cx="100" cy="100" r="60" stroke="url(#goalGradient)" strokeWidth="3" fill="none" opacity="0.5" />
      <circle cx="100" cy="100" r="40" stroke="url(#goalGradient)" strokeWidth="3" fill="none" opacity="0.7" />

      {/* Center target */}
      <circle cx="100" cy="100" r="20" fill="url(#goalGradient)" opacity="0.9" />

      {/* Flag on top */}
      <path
        d="M100 20 L100 50"
        stroke="url(#goalGradient)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M100 25 L120 30 L100 35 Z"
        fill="url(#goalGradient)"
        opacity="0.8"
      />

      {/* Decorative stars */}
      <path d="M160 40 L162 46 L168 48 L162 50 L160 56 L158 50 L152 48 L158 46 Z" fill="url(#goalGradient)" opacity="0.6" />
      <path d="M40 160 L42 166 L48 168 L42 170 L40 176 L38 170 L32 168 L38 166 Z" fill="url(#goalGradient)" opacity="0.6" />
    </svg>
  );
}

/**
 * Empty Transactions Illustration
 * Receipt/document with lines
 */
export function NoTransactionsIllustration({ className = '', width = 200, height = 200 }: IllustrationProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="receiptGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      {/* Receipt paper */}
      <rect x="50" y="30" width="100" height="140" rx="8" fill="url(#receiptGradient)" opacity="0.1" />
      <rect x="50" y="30" width="100" height="140" rx="8" stroke="url(#receiptGradient)" strokeWidth="2" fill="none" opacity="0.5" />

      {/* Serrated top */}
      <path d="M50 30 L55 35 L60 30 L65 35 L70 30 L75 35 L80 30 L85 35 L90 30 L95 35 L100 30 L105 35 L110 30 L115 35 L120 30 L125 35 L130 30 L135 35 L140 30 L145 35 L150 30" stroke="url(#receiptGradient)" strokeWidth="2" fill="none" opacity="0.5" />

      {/* Lines */}
      <line x1="65" y1="60" x2="135" y2="60" stroke="url(#receiptGradient)" strokeWidth="2" opacity="0.4" />
      <line x1="65" y1="80" x2="135" y2="80" stroke="url(#receiptGradient)" strokeWidth="2" opacity="0.4" />
      <line x1="65" y1="100" x2="120" y2="100" stroke="url(#receiptGradient)" strokeWidth="2" opacity="0.4" />
      <line x1="65" y1="120" x2="110" y2="120" stroke="url(#receiptGradient)" strokeWidth="2" opacity="0.4" />

      {/* Dollar sign */}
      <text x="100" y="150" textAnchor="middle" fill="url(#receiptGradient)" fontSize="24" fontWeight="bold" opacity="0.6">$</text>
    </svg>
  );
}

/**
 * Empty Data Illustration
 * Database/chart with no data
 */
export function NoDataIllustration({ className = '', width = 200, height = 200 }: IllustrationProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="dataGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      {/* Chart axes */}
      <line x1="40" y1="160" x2="160" y2="160" stroke="url(#dataGradient)" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <line x1="40" y1="40" x2="40" y2="160" stroke="url(#dataGradient)" strokeWidth="3" strokeLinecap="round" opacity="0.5" />

      {/* Dashed line placeholder */}
      <line x1="60" y1="100" x2="140" y2="100" stroke="url(#dataGradient)" strokeWidth="2" strokeDasharray="5,5" opacity="0.3" />

      {/* Empty bars */}
      <rect x="60" y="120" width="15" height="40" rx="4" fill="url(#dataGradient)" opacity="0.2" />
      <rect x="85" y="110" width="15" height="50" rx="4" fill="url(#dataGradient)" opacity="0.2" />
      <rect x="110" y="130" width="15" height="30" rx="4" fill="url(#dataGradient)" opacity="0.2" />
      <rect x="135" y="125" width="15" height="35" rx="4" fill="url(#dataGradient)" opacity="0.2" />

      {/* Magnifying glass */}
      <circle cx="140" cy="60" r="20" stroke="url(#dataGradient)" strokeWidth="3" fill="none" opacity="0.6" />
      <line x1="155" y1="75" x2="170" y2="90" stroke="url(#dataGradient)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/**
 * Empty Accounts Illustration
 * Bank/building with plus sign
 */
export function NoAccountsIllustration({ className = '', width = 200, height = 200 }: IllustrationProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="accountGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      {/* Bank building */}
      <path d="M100 40 L160 70 L160 160 L40 160 L40 70 Z" fill="url(#accountGradient)" opacity="0.1" />
      <path d="M100 40 L160 70 L160 160 L40 160 L40 70 Z" stroke="url(#accountGradient)" strokeWidth="2" fill="none" opacity="0.5" />

      {/* Columns */}
      <rect x="60" y="80" width="15" height="70" fill="url(#accountGradient)" opacity="0.3" />
      <rect x="93" y="80" width="15" height="70" fill="url(#accountGradient)" opacity="0.3" />
      <rect x="126" y="80" width="15" height="70" fill="url(#accountGradient)" opacity="0.3" />

      {/* Roof triangle */}
      <path d="M100 40 L160 70 L40 70 Z" fill="url(#accountGradient)" opacity="0.3" />

      {/* Base */}
      <rect x="30" y="155" width="140" height="10" fill="url(#accountGradient)" opacity="0.4" />

      {/* Plus sign */}
      <circle cx="150" cy="50" r="25" fill="url(#accountGradient)" opacity="0.9" />
      <line x1="150" y1="35" x2="150" y2="65" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="135" y1="50" x2="165" y2="50" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Empty Investments Illustration
 * Graph trending up with coins
 */
export function NoInvestmentsIllustration({ className = '', width = 200, height = 200 }: IllustrationProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="investGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      {/* Trending line */}
      <path
        d="M30 140 Q60 120, 80 100 T130 60 L170 40"
        stroke="url(#investGradient)"
        strokeWidth="3"
        fill="none"
        opacity="0.6"
        strokeLinecap="round"
      />

      {/* Area under curve */}
      <path
        d="M30 140 Q60 120, 80 100 T130 60 L170 40 L170 160 L30 160 Z"
        fill="url(#investGradient)"
        opacity="0.1"
      />

      {/* Coins */}
      <circle cx="50" cy="130" r="18" fill="url(#investGradient)" opacity="0.3" />
      <circle cx="50" cy="130" r="18" stroke="url(#investGradient)" strokeWidth="2" fill="none" opacity="0.6" />
      <text x="50" y="136" textAnchor="middle" fill="url(#investGradient)" fontSize="16" fontWeight="bold" opacity="0.8">$</text>

      <circle cx="90" cy="110" r="18" fill="url(#investGradient)" opacity="0.3" />
      <circle cx="90" cy="110" r="18" stroke="url(#investGradient)" strokeWidth="2" fill="none" opacity="0.6" />
      <text x="90" y="116" textAnchor="middle" fill="url(#investGradient)" fontSize="16" fontWeight="bold" opacity="0.8">$</text>

      {/* Arrow */}
      <path d="M165 35 L170 40 L175 35" stroke="url(#investGradient)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/**
 * Empty Search Results Illustration
 * Magnifying glass with question mark
 */
export function NoSearchResultsIllustration({ className = '', width = 200, height = 200 }: IllustrationProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="searchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      {/* Magnifying glass */}
      <circle cx="85" cy="85" r="50" stroke="url(#searchGradient)" strokeWidth="4" fill="none" opacity="0.5" />
      <circle cx="85" cy="85" r="45" fill="url(#searchGradient)" opacity="0.05" />
      <line x1="125" y1="125" x2="165" y2="165" stroke="url(#searchGradient)" strokeWidth="4" strokeLinecap="round" opacity="0.5" />

      {/* Question mark */}
      <path d="M75 70 Q75 60, 85 60 Q95 60, 95 70 Q95 80, 85 85 L85 95" stroke="url(#searchGradient)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
      <circle cx="85" cy="105" r="3" fill="url(#searchGradient)" opacity="0.7" />
    </svg>
  );
}
