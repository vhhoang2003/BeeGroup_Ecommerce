'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { formatPrice } from '@/lib/utils';

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    getTotalPrice,
    getTotalSavings,
    getTotalItems,
  } = useCartStore();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeCart();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const totalSavings = getTotalSavings();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#008ECC]" />
              <h2 className="text-lg font-bold text-[#222222]">
                Your Cart ({totalItems})
              </h2>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-gray-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#F3F9FB] flex items-center justify-center text-[#008ECC] mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-[#222222] mb-1">
                  Your cart is empty
                </h3>
                <p className="text-sm text-gray-500 max-w-xs mb-6">
                  Explore our deals and add items to your shopping cart.
                </p>
                <button
                  type="button"
                  onClick={closeCart}
                  className="bg-[#008ECC] hover:bg-[#0077b0] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-4 flex gap-3.5 items-center first:pt-0">
                  {/* Product Image */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F5F5F5] rounded-xl shrink-0 p-1.5 relative overflow-hidden flex items-center justify-center">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] sm:text-[14px] font-medium text-[#222222] truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-[#249B3E] font-medium mb-1">
                      Save {formatPrice(item.product.savings)}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-bold text-[#222222]">
                        {formatPrice(item.product.price)}
                      </span>

                      {/* Quantity selector */}
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold text-[#222222]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Delete Item */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-[#F9FBFD] space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#222222]">{formatPrice(totalPrice)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-[#249B3E]">
                    <span>Total Savings</span>
                    <span className="font-semibold">- {formatPrice(totalSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="text-[#249B3E] font-medium">FREE</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold text-[#222222]">
                  <span>Total Amount</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="flex-1 py-2.5 border border-gray-300 hover:border-[#008ECC] hover:text-[#008ECC] text-[#222222] text-center rounded-xl text-sm font-semibold transition-colors"
                >
                  View Full Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="flex-1 py-2.5 bg-[#008ECC] hover:bg-[#0077b0] text-white text-center rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
