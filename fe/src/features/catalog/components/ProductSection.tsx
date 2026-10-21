'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import SectionTitle from '@/components/ui/SectionTitle';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
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
    <section className="w-full max-w-[1240px] mx-auto px-4 mb-12 sm:mb-16">
      <RevealOnScroll>
        <SectionTitle prefix={prefix} highlight={highlight} viewAllHref={viewAllHref} />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-5">
          {isLoading || !products
            ? [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-3.5 border border-line shadow-xs flex flex-col animate-pulse"
                >
                  <div className="w-full bg-slate-100 rounded-xl aspect-[4/3] mb-3" />
                  <div className="w-16 h-3 bg-slate-100 rounded-md mb-2" />
                  <div className="w-full h-4 bg-slate-100 rounded-md mb-2" />
                  <div className="w-3/4 h-3 bg-slate-100 rounded-md mb-4" />
                  <div className="mt-auto pt-2 border-t border-line flex justify-between items-center">
                    <div className="w-24 h-5 bg-slate-100 rounded-md" />
                    <div className="w-14 h-5 bg-slate-100 rounded-md" />
                  </div>
                </div>
              ))
            : products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </RevealOnScroll>
    </section>
  );
}
