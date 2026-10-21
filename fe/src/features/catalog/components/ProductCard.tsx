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
      className={`group bg-white rounded-[16px] p-3 sm:p-3.5 flex flex-col relative transition-all duration-200 hover:shadow-md ${
        highlightBorder
          ? 'border-2 border-honey-500'
          : 'border border-line hover:border-honey-500/50'
      }`}
    >
      {product.subCategory && (
        <div className="absolute top-0 right-0 bg-ink text-white text-[11px] font-bold px-2.5 py-1 rounded-tr-[14px] rounded-bl-[10px] z-10 leading-tight">
          {product.subCategory.name}
        </div>
      )}

      {/* Product Image Container */}
      <div className="w-full bg-slate-100 rounded-[12px] h-[150px] sm:h-[170px] mb-3 relative overflow-hidden">
        <ProductThumb
          image={product.image}
          categorySlug={product.category.slug}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <span className="text-[11px] font-semibold uppercase tracking-wider text-honey-700 mb-0.5">
        {product.brand}
      </span>

      {/* Product Title */}
      <h3 className="text-[13px] sm:text-[14px] font-semibold text-ink line-clamp-1 mb-1 group-hover:text-honey-700 transition-colors">
        {product.name}
      </h3>

      <p className="text-[12px] text-muted line-clamp-2 mb-2 min-h-[2lh]">{product.shortDescription}</p>

      <div className="mt-auto border-t border-line pt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="text-[15px] sm:text-[16px] font-bold text-ink">
          {formatPrice(product.price) ?? t('contactForPrice')}
        </span>
        <StockBadge status={product.stockStatus} />
      </div>
    </Link>
  );
}
