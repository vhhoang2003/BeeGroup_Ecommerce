import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import CatalogBrowser from '@/features/catalog/components/CatalogBrowser';
import ProductsTitle from '@/features/catalog/components/ProductsTitle';
import { alternates } from '@/lib/seo';
import type { Locale } from '@/types/product';

export async function generateMetadata({ params }: PageProps<'/[locale]/products'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'catalog' });
  return {
    title: t('allProducts'),
    description: t('allProductsDescription'),
    alternates: alternates(locale as Locale, '/products'),
  };
}

export default async function ProductsPage({ params }: PageProps<'/[locale]/products'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tNav] = await Promise.all([
    getTranslations('catalog'),
    getTranslations('nav'),
  ]);
  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav aria-label={t('breadcrumb')} className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-honey-700 flex items-center gap-1 transition-colors">
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <span>{tNav('home')}</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-ink">{t('allProducts')}</span>
      </nav>

      <Suspense fallback={<div className="py-12 text-center text-slate-500 font-medium">{t('loadingProducts')}</div>}>
        <CatalogBrowser title={<ProductsTitle />} />
      </Suspense>
    </div>
  );
}
