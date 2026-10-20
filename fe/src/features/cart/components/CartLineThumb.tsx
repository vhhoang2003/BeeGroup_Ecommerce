import React from 'react';
import ProductThumb from '@/features/catalog/components/ProductThumb';
import type { CartItem } from '../store';

export default function CartLineThumb({ item, size = 'w-20 h-20' }: { item: CartItem; size?: string }) {
  return (
    <div className={`${size} rounded-xl bg-[#F5F5F5] shrink-0 relative overflow-hidden`}>
      <ProductThumb image={item.image} categorySlug={item.categorySlug} sizes="80px" />
    </div>
  );
}
