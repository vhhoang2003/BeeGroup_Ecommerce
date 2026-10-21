import React from 'react';
import Image from 'next/image';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import mark from '../../../public/brand/logo-mark.png';

/**
 * Brand lockup: the bee mark (public/brand/logo-mark.png) and the "Bee Store" wordmark set in type, so it stays
 * sharp and can turn white on dark surfaces (`tone="light"`). The full raster lockup is public/brand/logo-full.png.
 */
export default function Logo({
  className,
  tone = 'dark',
  size = 'md',
}: {
  className?: string;
  /** `dark` text for light backgrounds, `light` text for ink backgrounds. */
  tone?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}) {
  const box = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-12 h-12' }[size];
  const text = { sm: 'text-[17px]', md: 'text-[21px]', lg: 'text-[28px]' }[size];
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image src={mark} alt="" aria-hidden priority className={cn(box, 'object-contain')} sizes="48px" />
      <span className={cn(text, 'leading-none tracking-tight', tone === 'light' ? 'text-white' : 'text-ink')} aria-hidden>
        <span className="font-extrabold">Bee</span> <span className="font-normal">Store</span>
      </span>
      <span className="sr-only">{siteConfig.name}</span>
    </span>
  );
}
