'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Tag } from 'lucide-react';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalPrice,
    getTotalSavings,
    getTotalItems,
  } = useCartStore();

  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  const subtotal = getTotalPrice();
  const savings = getTotalSavings();
  const totalItems = getTotalItems();
  const couponDiscount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const finalTotal = Math.max(0, subtotal - couponDiscount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (coupon.toUpperCase() === 'MEGAMART10') {
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code. Try MEGAMART10');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-[1240px] mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="w-20 h-20 bg-[#F3F9FB] rounded-full flex items-center justify-center text-[#008ECC] mx-auto mb-5">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] mb-2">
          Your Shopping Cart is Empty
        </h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-8">
          Looks like you haven&apos;t added any items to your cart yet. Discover deals on smartphones, groceries, and electronics.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#008ECC] hover:bg-[#0077b0] text-white px-8 py-3 rounded-full font-bold text-sm shadow-md transition-all"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight mb-8">
        Shopping Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Items list */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Product Details
            </span>
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-red-500 hover:underline font-semibold"
            >
              Clear All Items
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div
                key={item.id}
                className="py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-20 h-20 bg-[#F5F5F5] rounded-xl shrink-0 p-2 relative overflow-hidden flex items-center justify-center">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      width={70}
                      height={70}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="text-sm font-semibold text-[#222222] hover:text-[#008ECC] transition-colors line-clamp-1"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Category: {item.product.category}
                    </p>
                    <p className="text-xs text-[#249B3E] font-semibold mt-1">
                      Save {formatPrice(item.product.savings)}
                    </p>
                  </div>
                </div>

                {/* Quantity & Price */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                  {/* Quantity */}
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 hover:bg-gray-100 text-gray-600 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-[#222222]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 hover:bg-gray-100 text-gray-600 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-right min-w-[90px]">
                    <p className="text-base font-bold text-[#222222]">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                    {item.product.originalPrice > item.product.price && (
                      <p className="text-xs text-gray-400 line-through">
                        {formatPrice(item.product.originalPrice * item.quantity)}
                      </p>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                    aria-label="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-4 space-y-5">
          {/* Coupon Box */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#222222] mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#008ECC]" />
              <span>Apply Promo Code</span>
            </h3>

            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon (MEGAMART10)"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                disabled={couponApplied}
                className="flex-1 bg-[#F5F5F5] border border-gray-200 rounded-xl px-3 py-2 text-xs uppercase outline-none focus:border-[#008ECC]"
              />
              <button
                type="submit"
                disabled={couponApplied}
                className="bg-[#008ECC] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#0077b0] transition-colors disabled:opacity-50"
              >
                {couponApplied ? 'Applied' : 'Apply'}
              </button>
            </form>

            {couponError && (
              <p className="text-xs text-red-500 mt-2">{couponError}</p>
            )}
            {couponApplied && (
              <p className="text-xs text-[#249B3E] font-medium mt-2">
                Coupon MEGAMART10 applied (10% extra discount)!
              </p>
            )}
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#222222] pb-3 border-b border-gray-100">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-[#222222]">{formatPrice(subtotal)}</span>
              </div>

              {savings > 0 && (
                <div className="flex justify-between text-[#249B3E]">
                  <span>Store Discount</span>
                  <span className="font-semibold">- {formatPrice(savings)}</span>
                </div>
              )}

              {couponApplied && (
                <div className="flex justify-between text-[#249B3E]">
                  <span>Promo Code (10%)</span>
                  <span className="font-semibold">- {formatPrice(couponDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Estimated Delivery</span>
                <span className="text-[#249B3E] font-semibold">FREE</span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-black text-[#222222]">
                <span>Total Amount</span>
                <span>{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push('/checkout')}
              className="w-full bg-[#008ECC] hover:bg-[#0077b0] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow transition-all cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-[#249B3E]" />
              <span>Safe and secure payments powered by Spring Boot API</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
