'use client';

import React from 'react';
import type { Category } from '@/types/category';
import type { ProductSort, StockStatus } from '@/types/product';
import { stockStatusLabel } from '@/lib/utils';

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

const sortOptions: { value: ProductSort; label: string }[] = [
  { value: 'featured', label: 'Nổi bật' },
  { value: 'price-asc', label: 'Giá: thấp đến cao' },
  { value: 'price-desc', label: 'Giá: cao đến thấp' },
  { value: 'newest', label: 'Mới nhất' },
];

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
        active ? 'bg-[#EBF6FA] text-[#008ECC] font-semibold' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

export default function ProductFilter({ categories, filters, lockCategory, onChange, onReset }: ProductFilterProps) {
  return (
    <aside className="w-full lg:w-64 shrink-0 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="font-bold text-[#222222] text-base">Bộ lọc</h3>
        <button type="button" onClick={onReset} className="text-xs font-semibold text-[#008ECC] hover:underline">
          Xoá lọc
        </button>
      </div>

      {/* Sort By */}
      <div>
        <label htmlFor="sort" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
          Sắp xếp
        </label>
        <select
          id="sort"
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as ProductSort })}
          className="w-full bg-[#F5F5F5] border border-gray-200 text-sm rounded-xl px-3 py-2 text-[#222222] outline-none focus:border-[#008ECC]"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category Filter */}
      {!lockCategory && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Danh mục</p>
          <div className="space-y-1.5">
            <OptionButton active={filters.category === ''} onClick={() => onChange({ category: '', sub: '' })}>
              <span>Tất cả danh mục</span>
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
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Tình trạng</p>
        <div className="space-y-1">
          <OptionButton active={filters.stock === ''} onClick={() => onChange({ stock: '' })}>
            <span>Tất cả</span>
          </OptionButton>
          {(Object.keys(stockStatusLabel) as StockStatus[]).map((status) => (
            <OptionButton key={status} active={filters.stock === status} onClick={() => onChange({ stock: status })}>
              <span>{stockStatusLabel[status]}</span>
            </OptionButton>
          ))}
        </div>
      </div>
    </aside>
  );
}
