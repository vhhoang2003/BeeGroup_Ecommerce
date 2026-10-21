'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { CatalogApi } from '@/lib/api/endpoints';
import type { ProductSummary } from '@/types/product';
import { formatPrice } from '@/lib/utils';
import { useAppLocale } from '../hooks';
import ProductThumb from './ProductThumb';

export default function SearchSuggestions() {
  const t = useTranslations('search');
  const tCommon = useTranslations('common');
  const locale = useAppLocale();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced autocomplete (250 ms, CAT-04)
  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const matches = await CatalogApi.searchSuggestions(query, locale);
        setResults(matches);
        setIsOpen(true);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, locale]);

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
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-[560px]">
      <form
        onSubmit={handleSearchSubmit}
        role="search"
        className="flex items-center w-full h-[44px] bg-paper rounded-[10px] px-3.5 border border-honey-200 focus-within:border-honey-500 focus-within:ring-2 focus-within:ring-honey-400/15 transition-all"
      >
        <Search className="w-[18px] h-[18px] text-honey-700 shrink-0 mr-2.5" />

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={t('placeholder')}
          aria-label={t('label')}
          className="w-full bg-transparent text-[13px] sm:text-[14px] text-ink placeholder:text-muted outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            aria-label={t('clear')}
            className="p-1 text-slate-400 hover:text-slate-600 mr-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => router.push('/products')}
          className="text-honey-700 hover:text-honey-800 transition-colors p-1"
          title={t('filter')}
          aria-label={t('filter')}
        >
          <SlidersHorizontal className="w-[18px] h-[18px]" />
        </button>
      </form>

      {/* Dropdown Suggestions */}
      {isOpen && (
        <div className="absolute top-[48px] left-0 w-full bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-2 border-b border-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{loading ? t('searching') : t('suggestions', { count: results.length })}</span>
            <span className="text-[11px] text-slate-400">{t('enterHint')}</span>
          </div>

          {results.length > 0 ? (
            <div className="divide-y divide-slate-50 max-h-[320px] overflow-y-auto">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 hover:bg-paper transition-colors group"
                >
                  <div className="w-10 h-10 rounded bg-slate-100 shrink-0 relative overflow-hidden">
                    <ProductThumb image={product.image} categorySlug={product.category.slug} sizes="40px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink group-hover:text-honey-700 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {product.category.name}
                      {product.subCategory ? ` · ${product.subCategory.name}` : ''}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-ink shrink-0">
                    {formatPrice(product.price) ?? tCommon('contactForPrice')}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            !loading && <div className="p-4 text-center text-sm text-slate-500">{t('noResults', { q: query })}</div>
          )}
        </div>
      )}
    </div>
  );
}
