import React from 'react';
import type { Locale } from '@/types/product';
import { cn } from '@/lib/utils';

/** Five-pointed star of radius 1 centred on the origin. */
const STAR = 'M0,-1L0.2245,-0.309L0.951,-0.309L0.363,0.118L0.588,0.809L0,0.382L-0.588,0.809L-0.363,0.118L-0.951,-0.309L-0.2245,-0.309Z';

const star = (x: number, y: number, r: number, fill: string, rotate = 0) => (
  <path d={STAR} fill={fill} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${r})`} />
);

function Vietnam() {
  return (
    <>
      <rect width="30" height="20" fill="#DA251D" />
      {star(15, 10.4, 6, '#FFFF00')}
    </>
  );
}

function China() {
  return (
    <>
      <rect width="30" height="20" fill="#EE1C25" />
      {star(5, 5, 3, '#FFFF00')}
      {star(10, 2, 1, '#FFFF00', 23)}
      {star(12, 4, 1, '#FFFF00', 46)}
      {star(12, 7, 1, '#FFFF00', 70)}
      {star(10, 9, 1, '#FFFF00', 21)}
    </>
  );
}

function UnitedStates() {
  const stripe = 20 / 13;
  return (
    <>
      <rect width="30" height="20" fill="#B22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect key={i} y={i * stripe} width="30" height={stripe} fill="#FFFFFF" />
      ))}
      <rect width="12" height={stripe * 7} fill="#3C3B6E" />
      {/* At icon size the 50 stars read as a dot grid. */}
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <circle key={`${row}-${col}`} cx={1.5 + col * 2.25} cy={1.6 + row * 2.4} r="0.55" fill="#FFFFFF" />
        ))
      )}
    </>
  );
}

const FLAGS: Record<Locale, () => React.ReactElement> = { vi: Vietnam, zh: China, en: UnitedStates };

/**
 * Flag for a site language: Vietnam for vi, China for zh, United States for en. Drawn as SVG because flag emoji
 * do not render on Windows.
 */
export default function Flag({ locale, className }: { locale: Locale; className?: string }) {
  const Shape = FLAGS[locale];
  return (
    <svg
      viewBox="0 0 30 20"
      aria-hidden
      className={cn('w-6 h-4 rounded-[3px] shrink-0 ring-1 ring-black/10 overflow-hidden', className)}
    >
      <Shape />
    </svg>
  );
}
