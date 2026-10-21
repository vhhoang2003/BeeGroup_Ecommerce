'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, ShoppingCart } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { ProductSummary } from '@/types/product';
import { MAX_QUANTITY, useCartStore } from '../store';
import QuantityInput from './QuantityInput';

/** Quantity + "Add to cart" on the product page; out-of-stock products cannot be added. */
export default function AddToCart({ product }: { product: ProductSummary }) {
  const t = useTranslations('cart');
  const add = useCartStore((s) => s.add);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stockStatus === 'OUT_OF_STOCK';

  const onAdd = () => {
    add(product, quantity);
    setAdded(true);
    setQuantity(1);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <QuantityInput
          value={quantity}
          onChange={(v) => setQuantity(Math.min(Math.max(v || 1, 1), MAX_QUANTITY))}
          label={t('quantity')}
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={outOfStock}
          className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-white text-[14px] font-bold px-6 py-2.5 rounded-full transition-colors cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-4 h-4" />
          {outOfStock ? t('outOfStock') : t('add')}
        </button>
      </div>
      {added && (
        <p role="status" className="flex items-center gap-1.5 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4" />
          {t('added')}{' '}
          <Link href="/cart" className="font-semibold text-honey-700 hover:underline">
            {t('viewCart')}
          </Link>
        </p>
      )}
    </div>
  );
}
