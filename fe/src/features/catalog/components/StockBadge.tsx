import React from 'react';
import { useTranslations } from 'next-intl';
import type { StockStatus } from '@/types/product';
import { cn } from '@/lib/utils';

const styles: Record<StockStatus, string> = {
  IN_STOCK: 'bg-emerald-50 text-emerald-700',
  LOW_STOCK: 'bg-amber-50 text-amber-700',
  OUT_OF_STOCK: 'bg-slate-100 text-slate-500',
  PRE_ORDER: 'bg-honey-50 text-honey-700',
};

export default function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  const t = useTranslations('stock');
  return (
    <span className={cn('inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md', styles[status], className)}>
      {t(status)}
    </span>
  );
}
