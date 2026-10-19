'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import SectionTitle from '@/components/ui/SectionTitle';
import ProductCard from './ProductCard';
import { CatalogApi } from '@/lib/api/endpoints';
import { mockSmartphoneDeals } from '@/lib/mocks/data';

export default function SmartphoneDeals() {
  const { data: products = mockSmartphoneDeals, isLoading } = useQuery({
    queryKey: ['deals', 'smartphones'],
    queryFn: () => CatalogApi.getSmartphoneDeals(),
    initialData: mockSmartphoneDeals,
  });

  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 mb-10 sm:mb-12">
      <SectionTitle
        prefix="Grab the best deal on"
        highlight="Smartphones"
        viewAllHref="/category/smartphones"
      />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-[16px] h-[260px] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              highlightBorder={product.isFeatured}
            />
          ))}
        </div>
      )}
    </section>
  );
}
