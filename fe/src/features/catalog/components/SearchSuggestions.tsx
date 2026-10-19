'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { CatalogApi } from '@/lib/api/endpoints';
import { Product } from '@/types/product';
import { formatPrice } from '@/lib/utils';

export default function SearchSuggestions() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced search logic (280ms)
  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const matches = await CatalogApi.searchSuggestions(query);
        setResults(matches);
        setIsOpen(true);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-[560px]">
      <form
        onSubmit={handleSearchSubmit}
        className="flex items-center w-full h-[44px] bg-[#F3F9FB] rounded-[10px] px-3.5 border border-[#E0F0F8] focus-within:border-[#008ECC] focus-within:ring-2 focus-within:ring-[#008ECC]/15 transition-all"
      >
        <Search className="w-[18px] h-[18px] text-[#008ECC] shrink-0 mr-2.5" />

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search essentials, groceries and more..."
          className="w-full bg-transparent text-[13px] sm:text-[14px] text-[#222222] placeholder:text-[#888888] outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 mr-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => router.push('/products')}
          className="text-[#008ECC] hover:text-[#0077b0] transition-colors p-1"
          title="Filter and Catalog"
        >
          <SlidersHorizontal className="w-[18px] h-[18px]" />
        </button>
      </form>

      {/* Dropdown Suggestions */}
      {isOpen && (
        <div className="absolute top-[48px] left-0 w-full bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-2 border-b border-gray-50 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>{loading ? 'Searching...' : `Matching results (${results.length})`}</span>
            <span className="text-[11px] text-gray-400">Press Enter to search all</span>
          </div>

          {results.length > 0 ? (
            <div className="divide-y divide-gray-50 max-h-[320px] overflow-y-auto">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 hover:bg-[#F3F9FB] transition-colors group"
                >
                  <div className="w-10 h-10 rounded bg-[#F5F5F5] shrink-0 relative overflow-hidden flex items-center justify-center p-1">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#222222] group-hover:text-[#008ECC] truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#222222]">
                      {formatPrice(product.price)}
                    </p>
                    {product.discountPercentage > 0 && (
                      <p className="text-[11px] text-[#249B3E] font-medium">
                        {product.discountPercentage}% OFF
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="p-4 text-center text-sm text-gray-500">
                No products found matching &ldquo;{query}&rdquo;
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
