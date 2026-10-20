'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { Category } from '@/types/category';
import type { ProductSort, StockStatus } from '@/types/product';
import { STOCK_STATUSES } from '@/lib/utils';

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
}

const SORTS: ProductSort[] = ['featured', 'price-asc', 'price-desc', 'newest'];

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
        active ? 'bg-[#EBF6FA] text-[#008ECC] font-semibold' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

export default function ProductFilter({ categories, filters, lockCategory, onChange, onReset }: ProductFilterProps) {
  const t = useTranslations('catalog');
  const tStock = useTranslations('stock');
  return (
    <aside className="w-full lg:w-64 shrink-0 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="font-bold text-[#222222] text-base">{t('filters')}</h3>
        <button type="button" onClick={onReset} className="text-xs font-semibold text-[#008ECC] hover:underline">
          {t('clearFilters')}
        </button>
      </div>

      {/* Sort By */}
      <div>
        <label htmlFor="sort" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
          {t('sort')}
        </label>
        <select
          id="sort"
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as ProductSort })}
          className="w-full bg-[#F5F5F5] border border-gray-200 text-sm rounded-xl px-3 py-2 text-[#222222] outline-none focus:border-[#008ECC]"
        >
          {SORTS.map((value) => (
            <option key={value} value={value}>
              {t(`sorts.${value}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Category Filter */}
      {!lockCategory && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">{t('category')}</p>
          <div className="space-y-1.5">
            <OptionButton active={filters.category === ''} onClick={() => onChange({ category: '', sub: '' })}>
              <span>{t('allCategories')}</span>
            </OptionButton>
            {categories.map((c) => (
              <OptionButton
                key={c.slug}
                active={filters.category === c.slug}
                onClick={() => onChange({ category: c.slug, sub: '' })}
              >
                <span>{c.name}</span>
                <span className="text-xs text-gray-400">({c.itemCount})</span>
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {/* Stock Filter */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">{t('stock')}</p>
        <div className="space-y-1">
          <OptionButton active={filters.stock === ''} onClick={() => onChange({ stock: '' })}>
            <span>{t('all')}</span>
          </OptionButton>
          {STOCK_STATUSES.map((status) => (
            <OptionButton key={status} active={filters.stock === status} onClick={() => onChange({ stock: status })}>
              <span>{tStock(status)}</span>
            </OptionButton>
          ))}
        </div>
      </div>
    </aside>
  );
}
