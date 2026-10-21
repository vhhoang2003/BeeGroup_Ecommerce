import React from 'react';
import { useTranslations } from 'next-intl';
import type { InquiryStatus } from '@/types/inquiry';
import { cn } from '@/lib/utils';

const styles: Record<InquiryStatus, string> = {
  NEW: 'bg-honey-50 text-honey-700',
  CONTACTED: 'bg-amber-50 text-amber-700',
  QUOTED: 'bg-violet-50 text-violet-700',
  CLOSED_WON: 'bg-emerald-50 text-emerald-700',
  CLOSED_LOST: 'bg-slate-100 text-slate-600',
  SPAM: 'bg-red-50 text-red-600',
};

export default function InquiryStatusBadge({ status, className }: { status: InquiryStatus; className?: string }) {
  const t = useTranslations('inquiryStatus');
  return (
    <span className={cn('inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap', styles[status], className)}>
      {t(status)}
    </span>
  );
}
