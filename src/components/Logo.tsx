import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 48, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Subtle F Motif in Background */}
    <g opacity={0.08}>
      <path
        d="M60 50 H140 M60 100 H120 M60 150 H100"
        stroke="#2563eb"
        strokeWidth={18}
        strokeLinecap="round"
      />
    </g>
    {/* Background Circle */}
    <circle cx="100" cy="100" r="90" fill="url(#logoGradient)" opacity={0.15} />
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#0ea5e9" />
      </linearGradient>
      <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#2563eb" />
      </radialGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {/* Main Logo Group */}
    <g>
      {/* Smoother Chart Line */}
      <path
        d="M40 140 Q70 90 100 110 Q130 130 160 60"
        stroke="url(#logoGradient)"
        strokeWidth={10}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />
      {/* Modern Nodes with Gradient */}
      <circle cx="70" cy="90" r="10" fill="url(#nodeGradient)" stroke="#fff" strokeWidth={3} />
      <circle cx="100" cy="110" r="10" fill="url(#nodeGradient)" stroke="#fff" strokeWidth={3} />
      <circle cx="130" cy="130" r="10" fill="url(#nodeGradient)" stroke="#fff" strokeWidth={3} />
      <circle cx="160" cy="60" r="10" fill="url(#nodeGradient)" stroke="#fff" strokeWidth={3} />
      {/* Connecting Lines */}
      <path d="M70 90 Q85 100 100 110" stroke="#fff" strokeWidth={2.5} strokeDasharray="4 4" />
      <path d="M100 110 Q115 120 130 130" stroke="#fff" strokeWidth={2.5} strokeDasharray="4 4" />
      <path d="M130 130 Q145 95 160 60" stroke="#fff" strokeWidth={2.5} strokeDasharray="4 4" />
      {/* Upward Trend Arrow */}
      <path
        d="M150 40 L160 60 L170 40"
        stroke="#0ea5e9"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    {/* Text "FinSight" */}
    <text
      x="100"
      y="175"
      textAnchor="middle"
      fontFamily="Inter, Arial, sans-serif"
      fontSize={30}
      fontWeight="bold"
      fill="#2563eb"
    >
      FinSight
    </text>
    <text
      x="100"
      y="192"
      textAnchor="middle"
      fontFamily="Inter, Arial, sans-serif"
      fontSize={14}
      fontWeight={600}
      fill="#0ea5e9"
    >
      AI Dashboard
    </text>
  </svg>
); 