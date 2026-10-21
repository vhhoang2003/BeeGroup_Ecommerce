import React from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  prefix: string;
  highlight: string;
  viewAllHref?: string;
  className?: string;
}

export default function SectionTitle({
  prefix,
  highlight,
  viewAllHref,
  className = '',
}: SectionTitleProps) {
  const t = useTranslations('common');
  return (
    <div className={cn('flex items-center justify-between border-b border-line pb-3.5 mb-6', className)}>
      <h2 className="text-[20px] sm:text-[24px] font-extrabold text-ink tracking-tight flex items-center relative">
        <span
          className="inline-block w-2.5 h-2.5 bg-honey rounded-[2px] rotate-45 mr-2.5 shrink-0 shadow-xs"
          aria-hidden="true"
        />
        <span>{prefix}</span>
        <span className="mx-1.5" aria-hidden="true" />
        <span className="text-honey-700 relative inline-block">
          {highlight}
          <span className="absolute -bottom-3.5 left-0 w-full h-[3px] bg-honey-gradient rounded-full" />
        </span>
      </h2>

      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="group flex items-center gap-1.5 text-[13px] sm:text-[14px] font-semibold text-slate-700 hover:text-ink transition-colors min-h-[40px] px-2 -mr-2 rounded-lg hover:bg-honey-50/60"
        >
          <span>{t('viewAll')}</span>
          <ChevronRight className="w-4 h-4 text-honey-700 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
