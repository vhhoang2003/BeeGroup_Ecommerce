import React from 'react';
import { useTranslations } from 'next-intl';
import type { StockStatus } from '@/types/product';
import { cn } from '@/lib/utils';

const styles: Record<StockStatus, string> = {
  IN_STOCK: 'bg-emerald-50 text-emerald-700',
  LOW_STOCK: 'bg-amber-50 text-amber-700',
  OUT_OF_STOCK: 'bg-gray-100 text-gray-500',
  PRE_ORDER: 'bg-[#EBF6FA] text-[#008ECC]',
};

export default function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  const t = useTranslations('stock');
  return (
    <span className={cn('inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md', styles[status], className)}>
      {t(status)}
    </span>
  );
}
