import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { ProductSummary } from '@/types/product';
import { formatPrice } from '@/lib/utils';
import ProductThumb from './ProductThumb';
import StockBadge from './StockBadge';

interface ProductCardProps {
  product: ProductSummary;
  highlightBorder?: boolean;
}

export default function ProductCard({ product, highlightBorder }: ProductCardProps) {
  const t = useTranslations('common');
  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group bg-white rounded-2xl p-3 sm:p-4 flex flex-col relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden ${
        highlightBorder
          ? 'border-2 border-honey-500 shadow-sm'
          : 'border border-line hover:border-honey-400'
      }`}
    >
      {product.subCategory && (
        <div className="absolute top-0 right-0 bg-ink text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl z-10 leading-tight shadow-xs">
          {product.subCategory.name}
        </div>
      )}

      {/* Product Image Container */}
      <div className="w-full bg-slate-50 rounded-xl aspect-[4/3] sm:h-[180px] mb-3 relative overflow-hidden flex items-center justify-center border border-slate-100">
        <ProductThumb
          image={product.image}
          categorySlug={product.category.slug}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
          className="transition-transform duration-500 ease-out group-hover:scale-108"
        />
      </div>

      {/* Brand */}
      <span className="text-[11px] font-bold uppercase tracking-wider text-honey-700 mb-1">
        {product.brand}
      </span>

      {/* Product Title */}
      <h3 className="text-[13px] sm:text-[15px] font-bold text-ink line-clamp-1 mb-1 group-hover:text-honey-700 transition-colors">
        {product.name}
      </h3>

      {/* Short description */}
      <p className="text-[12px] text-muted line-clamp-2 mb-3 min-h-[2lh] leading-relaxed">
        {product.shortDescription}
      </p>

      {/* Price & Stock Status footer */}
      <div className="mt-auto pt-2.5 border-t border-line flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <span className="text-[15px] sm:text-[17px] font-black text-ink tracking-tight">
          {formatPrice(product.price) ?? t('contactForPrice')}
        </span>
        <StockBadge status={product.stockStatus} />
      </div>
    </Link>
  );
}
