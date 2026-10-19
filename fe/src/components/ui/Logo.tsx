import React from 'react';
import { Hexagon } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-extrabold tracking-tight text-[#222222]', className)}>
      <Hexagon className="w-6 h-6 text-[#F5B301] fill-[#F5B301]" aria-hidden />
      <span className="text-[20px] leading-none">
        Bee <span className="text-[#008ECC]">Store</span>
      </span>
      <span className="sr-only">{siteConfig.name}</span>
    </span>
  );
}
