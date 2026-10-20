'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, ShoppingCart, Trash2, Truck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Spinner } from '@/components/ui/form';
import { formatPrice } from '@/lib/utils';
import { cartTotals, useCartStore, useHydrated } from '../store';
import QuantityInput from './QuantityInput';
import CartLineThumb from './CartLineThumb';

/** `/cart`: lines with quantity steppers, subtotal and the way to checkout. */
export default function CartView() {
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
  const tSite = useTranslations('site');
  const { items, setQuantity, remove, clear } = useCartStore();
  const hydrated = useHydrated();
  const totals = cartTotals(items);

  if (!hydrated) return <Spinner label={tCommon('loading')} />;

  if (items.length === 0) {
    return (
      <div className="max-w-[500px] mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#EBF6FA] text-[#008ECC] flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#222222] mb-2">{t('emptyTitle')}</h1>
        <p className="text-sm text-gray-500 mb-6">{t('emptyBody')}</p>
        <Link
          href="/products"
          className="inline-block bg-[#008ECC] hover:bg-[#0077b0] text-white px-8 py-3 rounded-full font-bold text-sm"
        >
          {t('continueShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222]">{t('title')}</h1>
        <button
          type="button"
          onClick={() => window.confirm(t('clearConfirm')) && clear()}
          className="text-xs font-semibold text-gray-500 hover:text-red-600 cursor-pointer"
        >
          {t('clear')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <ul className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/80 divide-y divide-gray-100">
          {items.map((item) => {
            const line = item.price === null ? null : item.price * item.quantity;
            return (
              <li key={item.productId} className="p-4 sm:p-5 flex gap-4">
                <CartLineThumb item={item} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#008ECC]">{item.brand}</p>
                  <Link href={`/products/${item.slug}`} className="font-semibold text-[#222222] hover:text-[#008ECC] line-clamp-2">
                    {item.name}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatPrice(item.price) ?? tCommon('contactForPrice')} {item.price !== null && t('each')}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                    <QuantityInput
                      value={item.quantity}
                      onChange={(v) => setQuantity(item.productId, v)}
                      label={t('quantityOf', { name: item.name })}
                    />
                    <span className="font-bold text-[#222222]">{formatPrice(line) ?? tCommon('contactForPrice')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.productId)}
                  aria-label={t('remove', { name: item.name })}
                  className="self-start p-1.5 text-gray-400 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>

        <aside className="lg:col-span-4 bg-[#F8FAFB] rounded-2xl border border-gray-200/80 p-5 sm:p-6 lg:sticky lg:top-24 space-y-4">
          <h2 className="text-lg font-bold text-[#222222]">{t('summary')}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">{t('items', { count: totals.count })}</dt>
              <dd className="font-semibold text-[#222222]">{formatPrice(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{t('shipping')}</dt>
              <dd className="text-gray-500">{t('shippingLater')}</dd>
            </div>
          </dl>
          <div className="flex justify-between items-baseline border-t border-gray-200 pt-4">
            <span className="font-bold text-[#222222]">{t('subtotal')}</span>
            <span className="text-2xl font-black text-[#222222]">{formatPrice(totals.subtotal)}</span>
          </div>
          {totals.hasUnpriced && <p className="text-xs text-amber-700">{t('unpricedNote')}</p>}
          <p className="flex items-start gap-1.5 text-xs text-[#008ECC] font-medium">
            <Truck className="w-4 h-4 shrink-0" />
            {tSite('delivery')}
          </p>
          <Link
            href="/checkout"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#008ECC] hover:bg-[#0077b0] text-white py-3 rounded-xl font-bold text-sm"
          >
            {t('checkout')}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/products" className="block text-center text-sm font-semibold text-[#008ECC] hover:underline">
            {t('continueShopping')}
          </Link>
        </aside>
      </div>
    </div>
  );
}
