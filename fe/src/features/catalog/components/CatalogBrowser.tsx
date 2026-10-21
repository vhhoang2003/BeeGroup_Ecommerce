'use client';

import React, { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { CatalogApi } from '@/lib/api/endpoints';
import type { ProductSort, StockStatus } from '@/types/product';
import { useAppLocale, useCategories } from '../hooks';
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
  const t = useTranslations('catalog');
  const locale = useAppLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const filters: CatalogFilters = {
    category: fixedCategory ?? searchParams.get('category') ?? '',
    sub: searchParams.get('sub') ?? '',
    stock: (searchParams.get('stock') as StockStatus) ?? '',
    sort: (searchParams.get('sort') as ProductSort) ?? 'featured',
  };
  const q = searchParams.get('q') ?? '';
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);

  const { data: categories = [] } = useCategories();

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
    queryKey: ['products', locale, params],
    queryFn: () => CatalogApi.getProducts(params, locale),
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
  const handleReset = () => {
    router.push(pathname);
    setMobileDrawerOpen(false);
  };

  const activeCategory = categories.find((c) => c.slug === filters.category);

  // Count active non-default filters for mobile badge
  let activeFilterCount = 0;
  if (!fixedCategory && filters.category) activeFilterCount++;
  if (filters.sub) activeFilterCount++;
  if (filters.stock) activeFilterCount++;
  if (filters.sort !== 'featured') activeFilterCount++;

  return (
    <>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-line mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">{title}</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {response ? t('productCount', { count: response.totalElements }) : t('loading')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {q && (
            <button
              type="button"
              onClick={() => navigate({ q: '', page: 1 })}
              className="text-xs bg-honey-50 border border-honey-200 text-honey-800 font-bold px-3 py-1.5 rounded-full hover:bg-ink hover:text-white transition-colors w-fit min-h-[36px] flex items-center gap-1.5"
            >
              <span>{t('clearSearch', { q })}</span>
              <span className="text-sm">&times;</span>
            </button>
          )}

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-line shadow-xs text-sm font-bold text-ink hover:border-honey-500 hover:text-honey-700 transition-colors min-h-[44px]"
            aria-label={t('filterDrawerTitle')}
          >
            <SlidersHorizontal className="w-4 h-4 text-honey-700" />
            <span>{t('filters')}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-honey text-ink text-xs font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sub-category chips strip (CAT-02) */}
      {activeCategory && activeCategory.subCategories.length > 1 && (
        <div className="overflow-x-auto scrollbar-none pb-2 mb-6">
          <div className="flex items-center gap-2 min-w-max">
            {[{ slug: '', name: t('all'), itemCount: activeCategory.itemCount }, ...activeCategory.subCategories].map(
              (s) => (
                <button
                  key={s.slug || 'all'}
                  type="button"
                  onClick={() => updateFilters({ sub: s.slug })}
                  aria-pressed={filters.sub === s.slug}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold min-h-[40px] transition-all cursor-pointer ${
                    filters.sub === s.slug
                      ? 'bg-ink text-white shadow-xs border border-ink'
                      : 'bg-white text-slate-700 hover:text-ink hover:bg-honey-50/80 hover:border-honey-300 border border-line'
                  }`}
                >
                  <span>{s.name}</span> <span className="opacity-70 text-xs font-normal">({s.itemCount})</span>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Desktop Sidebar + Products */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Desktop Sidebar */}
        <ProductFilter
          categories={categories}
          filters={filters}
          lockCategory={!!fixedCategory}
          onChange={updateFilters}
          onReset={handleReset}
        />

        {/* Product Grid Area */}
        <div className="flex-1 w-full">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-line shadow-xs flex flex-col animate-pulse">
                  <div className="w-full bg-slate-100 rounded-xl aspect-[4/3] mb-3" />
                  <div className="w-16 h-3 bg-slate-100 rounded-md mb-2" />
                  <div className="w-full h-4 bg-slate-100 rounded-md mb-2" />
                  <div className="w-3/4 h-3 bg-slate-100 rounded-md mb-4" />
                  <div className="mt-auto pt-2 border-t border-line flex justify-between items-center">
                    <div className="w-24 h-5 bg-slate-100 rounded-md" />
                    <div className="w-14 h-5 bg-slate-100 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-honey-50 border border-honey-200 flex items-center justify-center text-honey-700 mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-ink mb-2">{t('emptyTitle')}</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">{t('emptyHint')}</p>
              <button
                type="button"
                onClick={handleReset}
                className="bg-ink hover:bg-ink-800 text-white px-6 py-2.5 rounded-full text-sm font-bold min-h-[44px] transition-all shadow-xs"
              >
                {t('clearFilters')}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-5">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {response && response.totalPages > 1 && (
                <nav className="flex items-center justify-center gap-2 mt-10" aria-label={t('pagination')}>
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => navigate({ page: page - 1 })}
                    aria-label={t('prevPage')}
                    className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center border border-line bg-white text-slate-700 hover:border-honey-500 hover:text-ink hover:bg-honey-50 shadow-xs transition-all disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
                  </button>

                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-[280px] sm:max-w-none">
                    {[...Array(response.totalPages)].map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => navigate({ page: i + 1 })}
                        aria-current={page === i + 1 ? 'page' : undefined}
                        className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full text-sm font-bold transition-all cursor-pointer ${
                          page === i + 1
                            ? 'bg-ink text-white shadow-xs border border-ink'
                            : 'bg-white border border-line text-slate-700 hover:bg-paper hover:text-ink'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={response.last}
                    onClick={() => navigate({ page: page + 1 })}
                    aria-label={t('nextPage')}
                    className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center border border-line bg-white text-slate-700 hover:border-honey-500 hover:text-ink hover:bg-honey-50 shadow-xs transition-all disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.2]" />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer / Sheet */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 right-0 w-full max-w-[340px] bg-white shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200 overflow-y-auto">
            <div>
              {/* Header */}
              <div className="p-4 border-b border-line flex items-center justify-between bg-paper sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-honey-700" />
                  <h3 className="font-extrabold text-ink text-base">{t('filterDrawerTitle')}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center text-slate-500 hover:text-ink hover:bg-slate-200/60 transition-colors"
                  aria-label={t('closeFilters')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Controls */}
              <div className="p-4">
                <ProductFilter
                  categories={categories}
                  filters={filters}
                  lockCategory={!!fixedCategory}
                  onChange={updateFilters}
                  onReset={handleReset}
                  isMobileDrawer
                  className="p-0 border-0 shadow-none space-y-5"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-line bg-paper sticky bottom-0 z-10 flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl border border-line bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 min-h-[44px] transition-colors"
              >
                {t('clearFilters')}
              </button>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-ink hover:bg-ink-800 text-white text-sm font-bold min-h-[44px] transition-colors shadow-xs"
              >
                {t('applyFilters', { count: response?.totalElements ?? 0 })}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
