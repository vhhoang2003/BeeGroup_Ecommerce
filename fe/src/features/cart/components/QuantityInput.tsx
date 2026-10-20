'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAX_QUANTITY } from '../store';

/** − / + stepper with a typed value, 1 to MAX_QUANTITY. */
export default function QuantityInput({
  value,
  onChange,
  label,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  className?: string;
}) {
  const t = useTranslations('cart');
  const btn =
    'w-9 h-9 flex items-center justify-center text-gray-600 hover:text-[#008ECC] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';
  return (
    <div className={cn('inline-flex items-center rounded-full border border-gray-200 bg-white', className)}>
      <button type="button" className={btn} disabled={value <= 1} onClick={() => onChange(value - 1)} aria-label={t('decrease')}>
        <Minus className="w-4 h-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_QUANTITY}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="w-10 text-center text-sm font-semibold text-[#222222] bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        className={btn}
        disabled={value >= MAX_QUANTITY}
        onClick={() => onChange(value + 1)}
        aria-label={t('increase')}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
