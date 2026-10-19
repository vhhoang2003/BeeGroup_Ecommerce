'use client';

import React, { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  Plus,
  Minus,
  ShoppingCart,
  Zap,
} from 'lucide-react';
import { CatalogApi } from '@/lib/api/endpoints';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/features/cart/store/useCartStore';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => CatalogApi.getProduct(id),
  });

  if (isLoading) {
    return (
      <div className="max-w-[1240px] mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-[#008ECC] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1240px] mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-[#222222] mb-3">Product Not Found</h2>
        <p className="text-gray-500 mb-6">The product you are looking for does not exist or has been moved.</p>
        <Link
          href="/products"
          className="bg-[#008ECC] text-white px-6 py-2.5 rounded-full font-semibold"
        >
          Back to Catalogue
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push('/checkout');
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#008ECC]">
          Home
        </Link>
        <span>/</span>
        <Link href={`/category/${product.categorySlug}`} className="hover:text-[#008ECC]">
          {product.category}
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#222222] truncate max-w-[200px] sm:max-w-none">
          {product.name}
        </span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl p-5 sm:p-8 border border-gray-100 shadow-xs">
        {/* Left: Gallery & Visuals */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full bg-[#F5F5F5] rounded-2xl h-[320px] sm:h-[400px] flex items-center justify-center p-6 relative overflow-hidden border border-gray-200/70">
            {product.discountPercentage > 0 && (
              <span className="absolute top-4 left-4 bg-[#008ECC] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                {product.discountPercentage}% OFF
              </span>
            )}
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-contain hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-2 w-full mt-6 text-center text-xs text-gray-600">
            <div className="p-3 bg-[#F8FAFB] rounded-xl border border-gray-100 flex flex-col items-center">
              <ShieldCheck className="w-5 h-5 text-[#008ECC] mb-1" />
              <span className="font-semibold text-[#222222]">100% Genuine</span>
              <span className="text-[10px] text-gray-400">Brand Warranty</span>
            </div>
            <div className="p-3 bg-[#F8FAFB] rounded-xl border border-gray-100 flex flex-col items-center">
              <RotateCcw className="w-5 h-5 text-[#008ECC] mb-1" />
              <span className="font-semibold text-[#222222]">7-Day Return</span>
              <span className="text-[10px] text-gray-400">Hassle-Free</span>
            </div>
            <div className="p-3 bg-[#F8FAFB] rounded-xl border border-gray-100 flex flex-col items-center">
              <Truck className="w-5 h-5 text-[#008ECC] mb-1" />
              <span className="font-semibold text-[#222222]">Free Delivery</span>
              <span className="text-[10px] text-gray-400">On all orders</span>
            </div>
          </div>
        </div>

        {/* Right: Product Info & Actions */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#008ECC] bg-[#EBF6FA] px-2.5 py-0.5 rounded-md">
                {product.brand}
              </span>
              <div className="flex items-center gap-1 text-xs text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{product.rating}</span>
                <span className="text-gray-400 font-normal">({product.reviewCount} ratings)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight mb-3">
              {product.name}
            </h1>

            {/* Price Box */}
            <div className="p-4 bg-[#F8FAFB] rounded-2xl border border-gray-200/80 mb-5">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-3xl font-black text-[#222222]">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-base text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                <span className="text-sm font-bold text-[#008ECC] bg-white px-2 py-0.5 rounded-md border border-[#008ECC]/30">
                  {product.discountPercentage}% OFF
                </span>
              </div>
              <p className="text-sm font-semibold text-[#249B3E]">
                You Save: {formatPrice(product.savings || product.originalPrice - product.price)} (Inclusive of all taxes)
              </p>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              {product.description}
            </p>

            {/* Key Features */}
            {product.features && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                  Key Features
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#008ECC]" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications Table */}
            {product.specs && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                  Specifications
                </h4>
                <div className="rounded-xl border border-gray-200 overflow-hidden text-xs">
                  {Object.entries(product.specs).map(([k, v], idx) => (
                    <div
                      key={k}
                      className={`flex py-2 px-3 ${
                        idx % 2 === 0 ? 'bg-[#F9FBFD]' : 'bg-white'
                      }`}
                    >
                      <span className="w-1/3 font-semibold text-gray-500">{k}</span>
                      <span className="w-2/3 text-[#222222] font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Footer: Quantity + Add To Cart + Buy Now */}
          <div className="pt-6 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between sm:justify-start border border-gray-300 rounded-xl px-2 py-1.5 bg-white">
                <span className="text-xs text-gray-500 mr-2 sm:hidden">Quantity:</span>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-[#222222]">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  added
                    ? 'bg-[#249B3E] text-white shadow-sm'
                    : 'bg-[#F3F9FB] border border-[#008ECC] text-[#008ECC] hover:bg-[#008ECC] hover:text-white'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>

              {/* Buy Now Button */}
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 py-3 px-6 rounded-xl font-bold text-sm bg-[#008ECC] hover:bg-[#0077b0] text-white flex items-center justify-center gap-2 transition-all shadow-md hover:shadow cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
