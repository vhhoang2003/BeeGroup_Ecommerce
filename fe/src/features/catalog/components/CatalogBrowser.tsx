'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { CatalogApi } from '@/lib/api/endpoints';
import type { ProductSort, StockStatus } from '@/types/product';
import ProductCard from './ProductCard';
import ProductFilter, { type CatalogFilters } from './ProductFilter';

const PAGE_SIZE = 12;

interface CatalogBrowserProps {
  /** Scope the listing to one category (category page); otherwise the category comes from `?category=`. */
  category?: string;
  title: React.ReactNode;
}

/**
 * Product grid with sidebar filters and pagination. All filter state lives in the URL
 * (`?category=&sub=&stock=&sort=&q=&page=`) so listings are shareable (CAT-02, CAT-03).
 */
export default function CatalogBrowser({ category: fixedCategory, title }: CatalogBrowserProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: CatalogFilters = {
    category: fixedCategory ?? searchParams.get('category') ?? '',
    sub: searchParams.get('sub') ?? '',
    stock: (searchParams.get('stock') as StockStatus) ?? '',
    sort: (searchParams.get('sort') as ProductSort) ?? 'featured',
  };
  const q = searchParams.get('q') ?? '';
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => CatalogApi.getCategories(),
  });

  const params = {
    category: filters.category || undefined,
    sub: filters.sub || undefined,
    stock: filters.stock || undefined,
    sort: filters.sort,
    q: q || undefined,
    page: page - 1,
    size: PAGE_SIZE,
  };
  const { data: response, isLoading } = useQuery({
    queryKey: ['products', params],
    queryFn: () => CatalogApi.getProducts(params),
  });
  const products = response?.content ?? [];

  const navigate = (changes: Record<string, string | number>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === '' || (key === 'sort' && value === 'featured') || (key === 'page' && value === 1)) next.delete(key);
      else next.set(key, String(value));
    }
    const s = next.toString();
    router.push(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  // Any filter change goes back to the first page.
  const updateFilters = (changes: Partial<CatalogFilters>) => navigate({ ...changes, page: 1 });
  const handleReset = () => router.push(pathname);

  const activeCategory = categories.find((c) => c.slug === filters.category);

  return (
    <>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-gray-200 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {response ? `${response.totalElements} sản phẩm` : 'Đang tải…'}
          </p>
        </div>

        {q && (
          <button
            type="button"
            onClick={() => navigate({ q: '', page: 1 })}
            className="text-xs bg-[#EBF6FA] text-[#008ECC] font-semibold px-3 py-1.5 rounded-full hover:bg-[#008ECC] hover:text-white transition-colors w-fit"
          >
            Bỏ tìm kiếm &ldquo;{q}&rdquo; &times;
          </button>
        )}
      </div>

      {/* Sub-category chips (CAT-02) */}
      {activeCategory && activeCategory.subCategories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {[{ slug: '', name: 'Tất cả', itemCount: activeCategory.itemCount }, ...activeCategory.subCategories].map(
            (s) => (
              <button
                key={s.slug || 'all'}
                type="button"
                onClick={() => updateFilters({ sub: s.slug })}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                  filters.sub === s.slug
                    ? 'bg-[#008ECC] text-white'
                    : 'bg-[#F3F9FB] text-[#222222] hover:bg-[#E2F2F9] hover:text-[#008ECC]'
                }`}
              >
                {s.name} <span className="opacity-70">({s.itemCount})</span>
              </button>
            )
          )}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <ProductFilter
          categories={categories}
          filters={filters}
          lockCategory={!!fixedCategory}
          onChange={updateFilters}
          onReset={handleReset}
        />

        <div className="flex-1 w-full">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-[300px] bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
              <div className="w-16 h-16 rounded-full bg-[#F3F9FB] flex items-center justify-center text-[#008ECC] mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#222222] mb-2">Không có sản phẩm phù hợp</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                Thử bỏ bớt bộ lọc hoặc tìm với từ khoá khác như &ldquo;7B13&rdquo;, &ldquo;SP3&rdquo;, &ldquo;64 nhân&rdquo;.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="bg-[#008ECC] hover:bg-[#0077b0] text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors"
              >
                Xoá bộ lọc
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {response && response.totalPages > 1 && (
                <nav className="flex items-center justify-center gap-1.5 mt-8" aria-label="Phân trang">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => navigate({ page: page - 1 })}
                    aria-label="Trang trước"
                    className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 text-gray-600 hover:border-[#008ECC] hover:text-[#008ECC] disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {[...Array(response.totalPages)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => navigate({ page: i + 1 })}
                      aria-current={page === i + 1 ? 'page' : undefined}
                      className={`w-9 h-9 rounded-full text-sm font-semibold ${
                        page === i + 1 ? 'bg-[#008ECC] text-white' : 'text-gray-600 hover:bg-[#F3F9FB]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={response.last}
                    onClick={() => navigate({ page: page + 1 })}
                    aria-label="Trang sau"
                    className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 text-gray-600 hover:border-[#008ECC] hover:text-[#008ECC] disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
