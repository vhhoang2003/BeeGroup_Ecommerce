import React from 'react';
import HeroBanner from '@/features/catalog/components/HeroBanner';
import CategoryTiles from '@/features/catalog/components/CategoryTiles';
import ProductSection from '@/features/catalog/components/ProductSection';
import ContactCta from '@/features/engagement/components/ContactCta';

export default function HomePage() {
  return (
    <div className="w-full flex flex-col items-center">
      <HeroBanner />
      <CategoryTiles />
      <ProductSection prefix="Sản phẩm" highlight="nổi bật" viewAllHref="/products" />
      <ProductSection prefix="Mainboard" highlight="SP3" viewAllHref="/category/mainboard" category="mainboard" />
      <ProductSection prefix="Tản nhiệt" highlight="cho EPYC" viewAllHref="/category/cooler" category="cooler" />
      <ContactCta />
    </div>
  );
}
