import React from "react";

interface FaviconProps {
  size?: number;
  className?: string;
}

export const Favicon: React.FC<FaviconProps> = ({ size = 32, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="faviconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#0ea5e9" />
      </linearGradient>
      <radialGradient id="faviconNode" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#2563eb" />
      </radialGradient>
    </defs>
    {/* Background */}
    <rect width="32" height="32" rx="8" fill="url(#faviconGradient)" />
    {/* Chart Line */}
    <path d="M4 24 L10 18 L18 20 L28 10" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    {/* Nodes */}
    <circle cx="10" cy="18" r="2" fill="url(#faviconNode)" stroke="#fff" strokeWidth={1} />
    <circle cx="18" cy="20" r="2" fill="url(#faviconNode)" stroke="#fff" strokeWidth={1} />
    <circle cx="28" cy="10" r="2" fill="url(#faviconNode)" stroke="#fff" strokeWidth={1} />
    {/* Connecting Lines */}
    <path d="M10 18 L18 20" stroke="#fff" strokeWidth={1} strokeDasharray="2 2" />
    <path d="M18 20 L28 10" stroke="#fff" strokeWidth={1} strokeDasharray="2 2" />
    {/* Upward Arrow */}
    <path d="M22 6 L28 2 L32 6" stroke="#0ea5e9" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
); 