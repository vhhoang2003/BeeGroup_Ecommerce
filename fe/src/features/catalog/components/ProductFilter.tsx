'use client';

import React from 'react';
import { mockCategories } from '@/lib/mocks/data';

interface ProductFilterProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  sortBy: string;
  onSelectSort: (sort: string) => void;
  onReset: () => void;
}

const brands = ['Samsung', 'Apple', 'realme', 'Xiaomi', 'FreshFarm', 'FitPro'];

export default function ProductFilter({
  selectedCategory,
  onSelectCategory,
  selectedBrand,
  onSelectBrand,
  sortBy,
  onSelectSort,
  onReset,
}: ProductFilterProps) {
  return (
    <aside className="w-full lg:w-64 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="font-bold text-[#222222] text-base">Filters</h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-[#008ECC] hover:underline"
        >
          Reset All
        </button>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => onSelectSort(e.target.value)}
          className="w-full bg-[#F5F5F5] border border-gray-200 text-sm rounded-xl px-3 py-2 text-[#222222] outline-none focus:border-[#008ECC]"
        >
          <option value="featured">Featured Deals</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="discount">Highest Discount</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
          Categories
        </label>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => onSelectCategory('')}
            className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
              selectedCategory === ''
                ? 'bg-[#EBF6FA] text-[#008ECC] font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>All Categories</span>
          </button>
          {mockCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCategory(c.slug)}
              className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                selectedCategory === c.slug
                  ? 'bg-[#EBF6FA] text-[#008ECC] font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{c.name}</span>
              <span className="text-xs text-gray-400">({c.itemCount})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Brand Filter */}
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
          Brands
        </label>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelectBrand('')}
            className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors ${
              selectedBrand === ''
                ? 'bg-[#EBF6FA] text-[#008ECC] font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            All Brands
          </button>
          {brands.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => onSelectBrand(b)}
              className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors ${
                selectedBrand.toLowerCase() === b.toLowerCase()
                  ? 'bg-[#EBF6FA] text-[#008ECC] font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
