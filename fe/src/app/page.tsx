import React from 'react';
import HeroBanner from '@/features/catalog/components/HeroBanner';
import SmartphoneDeals from '@/features/catalog/components/SmartphoneDeals';
import CategoryCircles from '@/features/catalog/components/CategoryCircles';
import BrandBanners from '@/features/catalog/components/BrandBanners';
import DailyEssentials from '@/features/catalog/components/DailyEssentials';

export default function HomePage() {
  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. Hero Carousel */}
      <HeroBanner />

      {/* 2. Grab the best deal on Smartphones */}
      <SmartphoneDeals />

      {/* 3. Shop From Top Categories */}
      <CategoryCircles />

      {/* 4. Top Electronics Brands */}
      <BrandBanners />

      {/* 5. Daily Essentials */}
      <DailyEssentials />
    </div>
  );
}
