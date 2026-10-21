import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import CatalogBrowser from '@/features/catalog/components/CatalogBrowser';
import { fetchCategory } from '@/lib/api/server';
import { alternates } from '@/lib/seo';
import type { Locale } from '@/types/product';

// ISR window; must be a literal for Next.js to read it (same value as REVALIDATE_SECONDS).
export const revalidate = 300;

type Props = PageProps<'/[locale]/category/[slug]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await fetchCategory(slug, locale as Locale);
  if (!category) return {};
  const t = await getTranslations({ locale, namespace: 'catalog' });
  const description = t('categoryDescription', {
    name: category.name,
    subs: category.subCategories.map((s) => s.name).join(', '),
  });
  return {
    title: category.name,
    description,
    alternates: alternates(locale as Locale, `/category/${slug}`),
    openGraph: { title: category.name, description, images: category.image ? [category.image] : undefined },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [category, t, tNav] = await Promise.all([
    fetchCategory(slug, locale as Locale),
    getTranslations('catalog'),
    getTranslations('nav'),
  ]);
  if (!category) notFound();

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav aria-label={t('breadcrumb')} className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-honey-700">
          {tNav('home')}
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-honey-700">
          {t('products')}
        </Link>
        <span>/</span>
        <span className="font-semibold text-ink">{category.name}</span>
      </nav>

      <Suspense fallback={<div className="py-12 text-center text-slate-500">{t('loadingProducts')}</div>}>
        <CatalogBrowser category={slug} title={category.name} />
      </Suspense>
    </div>
  );
}
