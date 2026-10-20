'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Prev / next pager for 0-based paginated API responses. */
export default function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const t = useTranslations('catalog');
  if (totalPages <= 1) return null;
  const btn =
    'w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 text-gray-600 hover:border-[#008ECC] hover:text-[#008ECC] disabled:opacity-40 disabled:pointer-events-none cursor-pointer';
  return (
    <nav className="flex items-center justify-center gap-3 mt-6" aria-label={t('pagination')}>
      <button type="button" className={btn} disabled={page <= 0} onClick={() => onChange(page - 1)} aria-label={t('prevPage')}>
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm text-gray-600">
        {page + 1} / {totalPages}
      </span>
      <button
        type="button"
        className={btn}
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        aria-label={t('nextPage')}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
