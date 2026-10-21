'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import SectionTitle from '@/components/ui/SectionTitle';
import { Link } from '@/i18n/navigation';
import { isRemoteImage } from '@/lib/utils';
import { useCategories } from '../hooks';
import CategoryIcon from './CategoryIcon';

export default function CategoryTiles() {
  const t = useTranslations('home');
  const tCatalog = useTranslations('catalog');
  const { data: categories, isLoading } = useCategories();

  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 mb-12 sm:mb-16">
      <SectionTitle prefix={t('categoriesPrefix')} highlight={t('categoriesHighlight')} viewAllHref="/products" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {isLoading || !categories
          ? [...Array(5)].map((_, i) => (
              <div key={i} className="h-[180px] sm:h-[200px] bg-slate-100 rounded-2xl animate-pulse" />
            ))
          : categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group relative h-[180px] sm:h-[200px] rounded-2xl overflow-hidden border border-line bg-paper hover:border-honey-500 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between p-3.5 sm:p-4"
              >
                {/* Background image or large watermark icon */}
                {cat.image ? (
                  <>
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
                      unoptimized={isRemoteImage(cat.image)}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/50 to-ink/20 transition-opacity duration-300 group-hover:opacity-90" />
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-b from-paper to-slate-100" />
                    <CategoryIcon
                      slug={cat.slug}
                      strokeWidth={1}
                      className="absolute right-2 top-2 w-24 h-24 text-slate-300/40 transition-transform duration-500 group-hover:scale-110 group-hover:text-honey/30"
                    />
                  </>
                )}

                {/* Top Badge: Category Icon */}
                <div className="relative z-10 self-start">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-xs transition-colors duration-200 ${
                      cat.image
                        ? 'bg-ink/80 border-white/20 text-honey group-hover:bg-honey group-hover:text-ink'
                        : 'bg-white border-line text-honey-700 group-hover:border-honey-400'
                    }`}
                  >
                    <CategoryIcon slug={cat.slug} className="w-4 h-4" />
                  </div>
                </div>

                {/* Bottom Content */}
                <div className="relative z-10 mt-auto">
                  <p
                    className={`text-[16px] sm:text-[18px] font-extrabold tracking-tight leading-snug mb-1 transition-colors ${
                      cat.image ? 'text-white group-hover:text-honey' : 'text-ink group-hover:text-honey-700'
                    }`}
                  >
                    {cat.name}
                  </p>
                  <p
                    className={`text-[11px] sm:text-[12px] font-medium line-clamp-1 ${
                      cat.image ? 'text-slate-300' : 'text-muted'
                    }`}
                  >
                    <span className="font-semibold text-honey-500">{tCatalog('productCount', { count: cat.itemCount })}</span>
                    {cat.subCategories.length > 0 && ` · ${cat.subCategories.map((s) => s.name).join(', ')}`}
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
