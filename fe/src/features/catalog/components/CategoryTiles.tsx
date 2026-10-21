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
    <section className="w-full max-w-[1240px] mx-auto px-4 mb-10 sm:mb-12">
      <SectionTitle prefix={t('categoriesPrefix')} highlight={t('categoriesHighlight')} viewAllHref="/products" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {isLoading || !categories
          ? [...Array(5)].map((_, i) => <div key={i} className="h-[150px] bg-slate-100 rounded-[16px] animate-pulse" />)
          : categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group relative h-[150px] sm:h-[170px] rounded-[16px] overflow-hidden border border-line hover:border-honey-500 bg-paper transition-all hover:shadow-md"
              >
                {cat.image ? (
                  <>
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 300px"
                      unoptimized={isRemoteImage(cat.image)}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
                  </>
                ) : (
                  <CategoryIcon
                    slug={cat.slug}
                    strokeWidth={1.25}
                    className="absolute right-3 top-3 w-20 h-20 text-honey-700/25 transition-transform duration-300 group-hover:scale-110"
                  />
                )}

                <div className="absolute left-4 right-4 bottom-3">
                  <p className={`text-[17px] sm:text-[19px] font-bold ${cat.image ? 'text-white' : 'text-ink'}`}>
                    {cat.name}
                  </p>
                  <p className={`text-[12px] line-clamp-1 ${cat.image ? 'text-white/80' : 'text-muted'}`}>
                    {tCatalog('productCount', { count: cat.itemCount })} ·{' '}
                    {cat.subCategories.map((s) => s.name).join(', ')}
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
