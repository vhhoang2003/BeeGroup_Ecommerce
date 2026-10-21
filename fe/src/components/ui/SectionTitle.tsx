import React from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

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
    <div className={`flex items-center justify-between border-b border-line pb-3 mb-5 ${className}`}>
      <h2 className="text-[19px] sm:text-[22px] font-semibold text-ink tracking-tight relative">
        <span>{prefix} </span>
        <span className="text-honey-700 relative inline-block">
          {highlight}
          {/* Underline cyan accent */}
          <span className="absolute -bottom-3 left-0 w-full h-[3px] bg-ink rounded-t-sm" />
        </span>
      </h2>

      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="group flex items-center gap-1 text-[13px] sm:text-[14px] font-medium text-ink hover:text-honey-700 transition-colors"
        >
          <span>{t('viewAll')}</span>
          <ChevronRight className="w-4 h-4 text-honey-700 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
