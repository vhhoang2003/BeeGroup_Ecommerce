import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

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
  return (
    <div className={`flex items-center justify-between border-b border-[#EDEDED] pb-3 mb-5 ${className}`}>
      <h2 className="text-[19px] sm:text-[22px] font-semibold text-[#222222] tracking-tight relative">
        <span>{prefix} </span>
        <span className="text-[#008ECC] relative inline-block">
          {highlight}
          {/* Underline cyan accent */}
          <span className="absolute -bottom-3 left-0 w-full h-[3px] bg-[#008ECC] rounded-t-sm" />
        </span>
      </h2>

      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="group flex items-center gap-1 text-[13px] sm:text-[14px] font-medium text-[#222222] hover:text-[#008ECC] transition-colors"
        >
          <span>Xem tất cả</span>
          <ChevronRight className="w-4 h-4 text-[#008ECC] transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
