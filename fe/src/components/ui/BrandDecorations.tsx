import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Subtle hexagon ornament SVG motif (used with restraint on banners / cards).
 */
export function HexagonIcon({
  className,
  strokeWidth = 1.5,
  fill = 'none',
}: {
  className?: string;
  strokeWidth?: number;
  fill?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('inline-block', className)}
      aria-hidden="true"
    >
      <polygon points="12 2 21 7.2 21 16.8 12 22 3 16.8 3 7.2 12 2" />
    </svg>
  );
}

/**
 * Subtle technical orbit line with node dots motif from the Bee Store logo.
 */
export function OrbitPattern({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('pointer-events-none select-none', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#facc15" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Outer orbit ellipse */}
      <ellipse cx="300" cy="150" rx="260" ry="90" stroke="url(#orbit-grad)" strokeWidth="1.2" strokeDasharray="4 6" />
      {/* Inner orbit ellipse */}
      <ellipse cx="300" cy="150" rx="190" ry="60" stroke="url(#orbit-grad)" strokeWidth="1" />
      {/* Network node dots */}
      <circle cx="80" cy="180" r="3" fill="#facc15" fillOpacity="0.4" />
      <circle cx="210" cy="95" r="2.5" fill="#f59e0b" fillOpacity="0.5" />
      <circle cx="390" cy="205" r="3.5" fill="#facc15" fillOpacity="0.6" />
      <circle cx="510" cy="120" r="2" fill="#f59e0b" fillOpacity="0.3" />
      {/* Subtle central hexagon node */}
      <polygon
        points="300 138 312 145 312 159 300 166 288 159 288 145"
        stroke="#facc15"
        strokeWidth="1"
        strokeOpacity="0.3"
        fill="none"
      />
    </svg>
  );
}

/**
 * Subtle tech grid with sparse hexagonal dots for hero / CTA backgrounds.
 */
export function TechGridPattern({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('pointer-events-none select-none', className)}
      aria-hidden="true"
    >
      <defs>
        <pattern id="tech-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.08" />
          <circle cx="0" cy="0" r="1" fill="currentColor" fillOpacity="0.18" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tech-grid)" />
    </svg>
  );
}
