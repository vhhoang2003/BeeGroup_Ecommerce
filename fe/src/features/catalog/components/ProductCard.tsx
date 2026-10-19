'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Check } from 'lucide-react';
import { Product } from '@/types/product';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/features/cart/store/useCartStore';

interface ProductCardProps {
  product: Product;
  highlightBorder?: boolean;
}

export default function ProductCard({ product, highlightBorder }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = React.useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      className={`group bg-white rounded-[16px] p-3 sm:p-3.5 flex flex-col justify-between relative transition-all duration-200 hover:shadow-md ${
        highlightBorder || product.isFeatured
          ? 'border-2 border-[#008ECC]'
          : 'border border-[#EDEDED] hover:border-[#008ECC]/50'
      }`}
    >
      {/* Discount Badge at Top Right */}
      {product.discountPercentage > 0 && (
        <div className="absolute top-0 right-0 bg-[#008ECC] text-white text-[11px] font-bold px-2.5 py-1 rounded-tr-[14px] rounded-bl-[10px] z-10 leading-tight">
          {product.discountPercentage}%<br />OFF
        </div>
      )}

      <Link href={`/products/${product.slug}`} className="flex flex-col flex-1">
        {/* Product Image Container */}
        <div className="w-full bg-[#F5F5F5] rounded-[12px] h-[150px] sm:h-[170px] flex items-center justify-center p-2 mb-3 relative overflow-hidden group-hover:bg-[#EEF7FB] transition-colors">
          <div className="relative w-full h-full">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 220px"
              className="object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Product Title */}
        <h3 className="text-[13px] sm:text-[14px] font-medium text-[#222222] line-clamp-1 mb-1.5 group-hover:text-[#008ECC] transition-colors">
          {product.name}
        </h3>

        {/* Pricing Row */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-[15px] sm:text-[16px] font-bold text-[#222222]">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-[12px] text-[#888888] line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Dividing Border */}
        <div className="border-t border-[#EDEDED] my-1.5" />

        {/* Savings Text & Add Button */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[12px] sm:text-[13px] font-semibold text-[#249B3E]">
            Save - {formatPrice(product.savings || product.originalPrice - product.price)}
          </span>

          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              added
                ? 'bg-[#249B3E] text-white'
                : 'bg-[#F3F9FB] text-[#008ECC] hover:bg-[#008ECC] hover:text-white'
            }`}
            title="Add to cart"
          >
            {added ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
          </button>
        </div>
      </Link>
    </div>
  );
}
