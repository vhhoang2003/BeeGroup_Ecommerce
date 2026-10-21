import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { ProductImage } from '@/types/product';
import { cn, isRemoteImage } from '@/lib/utils';
import CategoryIcon from './CategoryIcon';

interface ProductThumbProps {
  image: ProductImage | null;
  categorySlug: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}

/** Product photo filling its (relative) parent, or a category icon when the product has no photo yet. */
export default function ProductThumb({ image, categorySlug, sizes, priority, className }: ProductThumbProps) {
  const t = useTranslations('product');
  if (!image) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-honey-700/40 @container">
        <CategoryIcon slug={categorySlug} className="w-1/3 h-1/3 max-w-16 max-h-16" strokeWidth={1.25} />
        <span className="hidden @[120px]:block text-[11px] font-medium text-slate-400">{t('photoPending')}</span>
      </div>
    );
  }

  return (
    <Image
      src={image.url}
      alt={image.alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={isRemoteImage(image.url)}
      className={cn('object-cover', className)}
    />
  );
}
