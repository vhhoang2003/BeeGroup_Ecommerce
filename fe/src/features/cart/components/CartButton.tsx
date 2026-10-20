'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingCart } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cartTotals, useCartStore, useHydrated } from '../store';

/** Header cart icon with the number of units. */
export default function CartButton() {
  const t = useTranslations('cart');
  const items = useCartStore((s) => s.items);
  const hydrated = useHydrated();
  const count = hydrated ? cartTotals(items).count : 0;

  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? t('headerLabelCount', { count }) : t('headerLabel')}
      className="relative hover:opacity-80 transition-opacity"
    >
      <ShoppingCart className="w-[19px] h-[19px] text-[#008ECC]" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F5B301] text-[#222222] text-[10px] font-bold flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
