import React from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import HeroBanner from '@/features/catalog/components/HeroBanner';
import TrustStrip from '@/features/catalog/components/TrustStrip';
import CategoryTiles from '@/features/catalog/components/CategoryTiles';
import ProductSection from '@/features/catalog/components/ProductSection';
import ContactCta from '@/features/engagement/components/ContactCta';

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  return (
    <div className="w-full flex flex-col items-center">
      <HeroBanner />
      <TrustStrip />
      <CategoryTiles />
      <ProductSection prefix={t('featuredPrefix')} highlight={t('featuredHighlight')} viewAllHref="/products" />
      <ProductSection
        prefix={t('mainboardPrefix')}
        highlight={t('mainboardHighlight')}
        viewAllHref="/category/mainboard"
        category="mainboard"
      />
      <ProductSection
        prefix={t('coolerPrefix')}
        highlight={t('coolerHighlight')}
        viewAllHref="/category/cooler"
        category="cooler"
      />
      <ProductSection prefix={t('kvmPrefix')} highlight={t('kvmHighlight')} viewAllHref="/category/kvm" category="kvm" />
      <ContactCta />
    </div>
  );
}
