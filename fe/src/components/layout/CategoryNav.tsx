'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useCategories } from '@/features/catalog/hooks';
import CategoryIcon from '@/features/catalog/components/CategoryIcon';

export default function CategoryNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { data: categories = [] } = useCategories();

  // The admin area has its own navigation.
  if (pathname.startsWith('/admin')) return null;

  const pills = [
    { name: t('home'), href: '/', slug: '', active: pathname === '/' },
    ...categories.map((c) => ({
      name: c.name,
      href: `/category/${c.slug}`,
      slug: c.slug,
      active: pathname === `/category/${c.slug}`,
    })),
    { name: t('allProducts'), href: '/products', slug: '', active: pathname === '/products' },
    { name: t('about'), href: '/about', slug: '', active: pathname === '/about' },
    { name: t('contact'), href: '/contact', slug: '', active: pathname === '/contact' },
  ];

  return (
    <nav className="w-full bg-white border-b border-line overflow-x-auto scrollbar-none py-2 select-none">
      <div className="max-w-[1240px] mx-auto px-4 flex items-center gap-2 sm:gap-2.5 min-w-max">
        {pills.map((pill) => (
          <Link
            key={pill.href}
            href={pill.href}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-[13px] font-semibold min-h-[40px] transition-all duration-150 ${
              pill.active
                ? 'bg-ink text-white shadow-xs border border-ink'
                : 'bg-paper text-slate-700 hover:text-ink hover:bg-honey-50/80 hover:border-honey-300 border border-line/80'
            }`}
          >
            {pill.slug && (
              <CategoryIcon
                slug={pill.slug}
                className={`w-3.5 h-3.5 ${pill.active ? 'text-honey' : 'text-honey-700'}`}
              />
            )}
            <span>{pill.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
