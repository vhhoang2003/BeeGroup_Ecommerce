import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
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
  const t = await getTranslations('catalog');
  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 sm:py-8">
      <Suspense fallback={<div className="py-12 text-center text-gray-500">{t('loadingProducts')}</div>}>
        <CatalogBrowser title={<ProductsTitle />} />
      </Suspense>
    </div>
  );
}
