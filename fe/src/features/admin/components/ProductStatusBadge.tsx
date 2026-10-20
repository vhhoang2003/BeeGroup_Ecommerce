import React from 'react';
import { useTranslations } from 'next-intl';
import type { ProductStatus } from '@/types/admin';
import { cn } from '@/lib/utils';

const styles: Record<ProductStatus, string> = {
  DRAFT: 'bg-amber-50 text-amber-700',
  PUBLISHED: 'bg-emerald-50 text-emerald-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

export default function ProductStatusBadge({ status, className }: { status: ProductStatus; className?: string }) {
  const t = useTranslations('admin.productStatus');
  return (
    <span className={cn('inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md', styles[status], className)}>
      {t(status)}
    </span>
  );
}
