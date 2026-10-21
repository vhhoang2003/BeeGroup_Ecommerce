'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal } from 'lucide-react';
import type { Category } from '@/types/category';
import type { ProductSort, StockStatus } from '@/types/product';
import { STOCK_STATUSES } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface CatalogFilters {
  category: string;
  sub: string;
  stock: StockStatus | '';
  sort: ProductSort;
}

interface ProductFilterProps {
  categories: Category[];
  filters: CatalogFilters;
  /** Hide the category list when the page is already scoped to one category. */
  lockCategory?: boolean;
  onChange: (changes: Partial<CatalogFilters>) => void;
  onReset: () => void;
  className?: string;
  isMobileDrawer?: boolean;
}

const SORTS: ProductSort[] = ['featured', 'price-asc', 'price-desc', 'newest'];

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'w-full text-left text-sm px-3 py-2 rounded-xl transition-all flex items-center justify-between min-h-[40px] cursor-pointer',
        active
          ? 'bg-honey-50 text-honey-800 font-bold border border-honey-200/80 shadow-2xs'
          : 'text-slate-700 hover:bg-paper hover:text-ink'
      )}
    >
      {children}
    </button>
  );
}

export default function ProductFilter({
  categories,
  filters,
  lockCategory,
  onChange,
  onReset,
  className,
  isMobileDrawer,
}: ProductFilterProps) {
  const t = useTranslations('catalog');
  const tStock = useTranslations('stock');

  return (
    <div
      className={cn(
        'w-full bg-white p-5 rounded-2xl border border-line shadow-xs space-y-6',
        !isMobileDrawer && 'hidden lg:block lg:w-64 shrink-0 sticky top-24',
        className
      )}
    >
      <div className="flex items-center justify-between pb-3.5 border-b border-line">
        <h3 className="font-extrabold text-ink text-base tracking-tight flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-honey-700" />
          <span>{t('filters')}</span>
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-bold text-honey-700 hover:text-ink hover:underline transition-colors min-h-[36px] px-1 flex items-center"
        >
          {t('clearFilters')}
        </button>
      </div>

      {/* Sort By */}
      <div>
        <label htmlFor="sort" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          {t('sort')}
        </label>
        <div className="relative">
          <select
            id="sort"
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value as ProductSort })}
            className="w-full bg-paper border border-line text-sm rounded-xl px-3.5 py-2.5 text-ink font-semibold outline-none focus:border-honey-500 focus:ring-1 focus:ring-honey-500 transition-colors min-h-[42px] cursor-pointer appearance-none"
          >
            {SORTS.map((value) => (
              <option key={value} value={value}>
                {t(`sorts.${value}`)}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
            ▼
          </div>
        </div>
      </div>

      {/* Category Filter */}
      {!lockCategory && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">{t('category')}</p>
          <div className="space-y-1">
            <OptionButton active={filters.category === ''} onClick={() => onChange({ category: '', sub: '' })}>
              <span>{t('allCategories')}</span>
            </OptionButton>
            {categories.map((c) => (
              <OptionButton
                key={c.slug}
                active={filters.category === c.slug}
                onClick={() => onChange({ category: c.slug, sub: '' })}
              >
                <span className="truncate pr-2">{c.name}</span>
                <span className="text-xs text-slate-400 shrink-0 font-normal">({c.itemCount})</span>
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {/* Stock Filter */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">{t('stock')}</p>
        <div className="space-y-1">
          <OptionButton active={filters.stock === ''} onClick={() => onChange({ stock: '' })}>
            <span>{t('all')}</span>
          </OptionButton>
          {STOCK_STATUSES.map((status) => (
            <OptionButton
              key={status}
              active={filters.stock === status}
              onClick={() => onChange({ stock: status })}
            >
              <span>{tStock(status)}</span>
            </OptionButton>
          ))}
        </div>
      </div>
    </div>
  );
}
