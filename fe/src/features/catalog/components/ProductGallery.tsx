'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import type { ProductImage } from '@/types/product';
import ProductThumb from './ProductThumb';

interface ProductGalleryProps {
  images: ProductImage[];
  categorySlug: string;
  imageCredits: string | null;
}

/** Main photo with zoom on hover, thumbnail navigation and image credits (CAT-05). */
export default function ProductGallery({ images, categorySlug, imageCredits }: ProductGalleryProps) {
  const t = useTranslations('product');
  const [active, setActive] = useState(0);
  const mainImage = images[active] ?? images[0] ?? null;

  const handlePrev = () => {
    setActive((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActive((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="w-full">
      {/* Main Image Stage */}
      <div className="w-full bg-slate-50 rounded-2xl aspect-[4/3] relative overflow-hidden border border-line group shadow-xs">
        <ProductThumb
          image={mainImage}
          categorySlug={categorySlug}
          sizes="(max-width: 1024px) 100vw, 560px"
          priority
          className="transition-transform duration-500 ease-out group-hover:scale-108 cursor-zoom-in"
        />

        {/* Counter Badge */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-ink/75 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-full z-10 shadow-xs">
            {active + 1} / {images.length}
          </div>
        )}

        {/* Prev / Next Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label={t('viewImage', { n: active === 0 ? images.length : active })}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white/90 hover:bg-white text-ink border border-line shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer z-10 focus-visible:opacity-100 focus-visible:outline-honey-500"
            >
              <ChevronLeft className="w-5 h-5 text-ink stroke-[2.2]" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label={t('viewImage', { n: (active + 2 > images.length ? 1 : active + 2) })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white/90 hover:bg-white text-ink border border-line shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer z-10 focus-visible:opacity-100 focus-visible:outline-honey-500"
            >
              <ChevronRight className="w-5 h-5 text-ink stroke-[2.2]" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails row */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 mt-3.5">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={t('viewImage', { n: i + 1 })}
              aria-pressed={i === active}
              className={`relative aspect-square rounded-xl overflow-hidden bg-slate-50 border-2 transition-all cursor-pointer min-h-[44px] ${
                i === active
                  ? 'border-honey-500 ring-2 ring-honey-400/40 shadow-xs opacity-100'
                  : 'border-line hover:border-honey-300 opacity-70 hover:opacity-100'
              }`}
            >
              <ProductThumb image={img} categorySlug={categorySlug} sizes="100px" />
            </button>
          ))}
        </div>
      )}

      {/* Image Credits Accordion */}
      {imageCredits && (
        <details className="mt-4 text-[11px] text-slate-500 group/credits">
          <summary className="cursor-pointer flex items-center gap-1.5 hover:text-honey-700 font-medium py-1">
            <Info className="w-3.5 h-3.5 text-honey-700" />
            <span>{t('imageCredits')}</span>
          </summary>
          <p className="mt-2 whitespace-pre-line break-words bg-paper rounded-xl p-3.5 border border-line leading-relaxed text-slate-600">
            {imageCredits}
          </p>
        </details>
      )}
    </div>
  );
}
