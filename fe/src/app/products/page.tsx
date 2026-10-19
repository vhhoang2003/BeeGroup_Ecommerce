'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CatalogApi } from '@/lib/api/endpoints';
import ProductCard from '@/features/catalog/components/ProductCard';
import ProductFilter from '@/features/catalog/components/ProductFilter';
import { Search } from 'lucide-react';

function ProductsCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const search = searchParams.get('search') || '';

  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'discount' | 'rating'>('featured');

  const { data: response, isLoading } = useQuery({
    queryKey: ['products', category, brand, search, sortBy],
    queryFn: () =>
      CatalogApi.getProducts({
        category: category || undefined,
        brand: brand || undefined,
        search: search || undefined,
        sortBy,
      }),
  });

  const products = response?.content || [];

  const updateFilters = (newParams: { category?: string; brand?: string; search?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newParams.category !== undefined) {
      if (newParams.category) params.set('category', newParams.category);
      else params.delete('category');
    }
    if (newParams.brand !== undefined) {
      if (newParams.brand) params.set('brand', newParams.brand);
      else params.delete('brand');
    }
    if (newParams.search !== undefined) {
      if (newParams.search) params.set('search', newParams.search);
      else params.delete('search');
    }
    router.push(`/products?${params.toString()}`);
  };

  const handleReset = () => {
    setSortBy('featured');
    router.push('/products');
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 sm:py-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight">
            {search ? `Search results for "${search}"` : category ? `Category: ${category}` : 'All Products & Deals'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing {products.length} products available for quick delivery
          </p>
        </div>

        {search && (
          <button
            type="button"
            onClick={() => updateFilters({ search: '' })}
            className="text-xs bg-[#EBF6FA] text-[#008ECC] font-semibold px-3 py-1.5 rounded-full hover:bg-[#008ECC] hover:text-white transition-colors w-fit"
          >
            Clear Search &times;
          </button>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Filters */}
        <ProductFilter
          selectedCategory={category}
          onSelectCategory={(c) => updateFilters({ category: c })}
          selectedBrand={brand}
          onSelectBrand={(b) => updateFilters({ brand: b })}
          sortBy={sortBy}
          onSelectSort={(s) => setSortBy(s as typeof sortBy)}
          onReset={handleReset}
        />

        {/* Product Grid Area */}
        <div className="flex-1 w-full">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
              <div className="w-16 h-16 rounded-full bg-[#F3F9FB] flex items-center justify-center text-[#008ECC] mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#222222] mb-2">No matching products found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                Try selecting different category filters, or search for other keywords like Galaxy, iPhone, or Mango.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="bg-[#008ECC] hover:bg-[#0077b0] text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-[1240px] mx-auto px-4 py-12 text-center text-gray-500">Loading catalog...</div>}>
      <ProductsCatalogContent />
    </Suspense>
  );
}
