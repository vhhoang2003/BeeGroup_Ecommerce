'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Heart, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import ProductCard from '@/features/catalog/components/ProductCard';
import { useToggleWishlist, useWishlist } from '@/features/engagement/wishlist';
import { Alert, Card, Spinner } from '@/components/ui/form';
import { useErrorMessage } from '@/lib/api/errors';

/** Saved products (ENG-06). */
export default function WishlistPage() {
  const t = useTranslations('account');
  const tCommon = useTranslations('common');
  const errorMessage = useErrorMessage();
  const { data: products, isLoading, error } = useWishlist();
  const toggle = useToggleWishlist();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">{t('wishlist')}</h1>

      {isLoading && <Spinner label={tCommon('loading')} />}
      {error && <Alert>{errorMessage(error)}</Alert>}

      {products && products.length === 0 && (
        <Card className="text-center py-12">
          <Heart className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <p className="font-semibold text-ink mb-1">{t('emptyWishlist')}</p>
          <p className="text-sm text-slate-500 mb-4">{t('emptyWishlistHint')}</p>
          <Link href="/products" className="text-sm font-semibold text-honey-700 hover:underline">
            {t('browseProducts')}
          </Link>
        </Card>
      )}

      {products && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {products.map((product) => (
            <div key={product.id} className="relative">
              <ProductCard product={product} />
              <button
                type="button"
                onClick={() => toggle.mutate({ product, saved: true })}
                aria-label={t('removeFromWishlist', { name: product.name })}
                className="absolute top-2 left-2 z-20 w-8 h-8 rounded-full bg-white/95 shadow border border-slate-100 flex items-center justify-center text-slate-500 hover:text-rose-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
