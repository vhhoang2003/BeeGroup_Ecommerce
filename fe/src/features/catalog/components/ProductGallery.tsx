'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import type { ProductImage } from '@/types/product';
import ProductThumb from './ProductThumb';

interface ProductGalleryProps {
  images: ProductImage[];
  categorySlug: string;
  imageCredits: string | null;
}

/** Main photo with thumbnails and the image credits / licenses (CAT-05). */
export default function ProductGallery({ images, categorySlug, imageCredits }: ProductGalleryProps) {
  const t = useTranslations('product');
  const [active, setActive] = useState(0);
  const mainImage = images[active] ?? images[0] ?? null;

  return (
    <>
      <div className="w-full bg-[#F5F5F5] rounded-2xl aspect-[4/3] relative overflow-hidden border border-gray-200/70">
        <ProductThumb image={mainImage} categorySlug={categorySlug} sizes="(max-width: 1024px) 100vw, 480px" priority />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 mt-3">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={t('viewImage', { n: i + 1 })}
              aria-pressed={i === active}
              className={`relative aspect-square rounded-xl overflow-hidden bg-[#F5F5F5] border-2 transition-colors cursor-pointer ${
                i === active ? 'border-[#008ECC]' : 'border-transparent hover:border-[#008ECC]/40'
              }`}
            >
              <ProductThumb image={img} categorySlug={categorySlug} sizes="120px" />
            </button>
          ))}
        </div>
      )}

      {imageCredits && (
        <details className="mt-3 text-[11px] text-gray-500">
          <summary className="cursor-pointer flex items-center gap-1 hover:text-[#008ECC]">
            <Info className="w-3.5 h-3.5" />
            {t('imageCredits')}
          </summary>
          <p className="mt-2 whitespace-pre-line break-words bg-[#F8FAFB] rounded-lg p-3 border border-gray-100">
            {imageCredits}
          </p>
        </details>
      )}
    </>
  );
}
