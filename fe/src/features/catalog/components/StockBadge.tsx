import React from 'react';
import { useTranslations } from 'next-intl';
import type { StockStatus } from '@/types/product';
import { cn } from '@/lib/utils';

const styles: Record<StockStatus, { badge: string; dot: string }> = {
  IN_STOCK: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
    dot: 'bg-emerald-500',
  },
  LOW_STOCK: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200/70',
    dot: 'bg-amber-500',
  },
  OUT_OF_STOCK: {
    badge: 'bg-slate-100 text-slate-600 border-slate-200/70',
    dot: 'bg-slate-400',
  },
  PRE_ORDER: {
    badge: 'bg-honey-50 text-honey-800 border-honey-300',
    dot: 'bg-honey-500',
  },
};

export default function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  const t = useTranslations('stock');
  const style = styles[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-2xs',
        style.badge,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', style.dot)} aria-hidden="true" />
      <span>{t(status)}</span>
    </span>
  );
}
