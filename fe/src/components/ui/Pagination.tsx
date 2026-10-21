'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Prev / next pager for 0-based paginated API responses with >= 40px touch targets. */
export default function Pagination({
  page,
  totalPages,
  onChange,
  className,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  const t = useTranslations('catalog');
  if (totalPages <= 1) return null;

  const btn =
    'w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center border border-slate-200 bg-white text-slate-700 hover:border-honey-500 hover:text-ink hover:bg-honey-50 shadow-xs transition-all duration-150 disabled:opacity-35 disabled:pointer-events-none cursor-pointer focus-visible:outline-2 focus-visible:outline-honey-500 focus-visible:outline-offset-2';

  return (
    <nav className={cn('flex items-center justify-center gap-3 mt-8', className)} aria-label={t('pagination')}>
      <button
        type="button"
        className={btn}
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
        aria-label={t('prevPage')}
      >
        <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
      </button>

      <span className="text-sm font-semibold text-slate-700 px-3 py-1 bg-paper border border-line rounded-full">
        <span className="text-ink">{page + 1}</span>
        <span className="text-slate-400 mx-1.5">/</span>
        <span>{totalPages}</span>
      </span>

      <button
        type="button"
        className={btn}
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        aria-label={t('nextPage')}
      >
        <ChevronRight className="w-4 h-4 stroke-[2.2]" />
      </button>
    </nav>
  );
}
