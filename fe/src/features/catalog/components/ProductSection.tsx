'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import SectionTitle from '@/components/ui/SectionTitle';
import ProductCard from './ProductCard';
import { CatalogApi } from '@/lib/api/endpoints';
import { useAppLocale } from '../hooks';

interface ProductSectionProps {
  prefix: string;
  highlight: string;
  viewAllHref: string;
  /** Category slug to show; omit for the featured products. */
  category?: string;
}

/** A home-page row of product cards: featured products, or the first products of one category. */
export default function ProductSection({ prefix, highlight, viewAllHref, category }: ProductSectionProps) {
  const locale = useAppLocale();
  const { data: products, isLoading } = useQuery({
    queryKey: category ? ['products', locale, { category, size: 4 }] : ['products', locale, 'featured'],
    queryFn: async () =>
      category
        ? (await CatalogApi.getProducts({ category, size: 4 }, locale)).content
        : CatalogApi.getFeaturedProducts(locale),
  });

  if (!isLoading && !products?.length) return null;

  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 mb-10 sm:mb-12">
      <SectionTitle prefix={prefix} highlight={highlight} viewAllHref={viewAllHref} />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {isLoading || !products
          ? [...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 rounded-[16px] h-[300px] animate-pulse" />)
          : products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}
