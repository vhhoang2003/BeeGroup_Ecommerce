'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { checkoutSchema, CheckoutFormValues } from '@/features/checkout/schemas/checkoutSchema';
import { OrderApi } from '@/lib/api/endpoints';
import { formatPrice } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, getTotalSavings, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const subtotal = getTotalPrice();
  const savings = getTotalSavings();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.address?.fullName || user?.name || 'Hoang Nguyen',
      email: user?.email || 'hoang@framelab.dev',
      phone: user?.address?.phone || '+91 98765 43210',
      street: user?.address?.street || '42 MG Road, Cyber Hub',
      city: user?.address?.city || 'Gurugram',
      state: user?.address?.state || 'Haryana',
      postalCode: user?.address?.postalCode || '122002',
      paymentMethod: 'COD',
    },
  });

  const selectedPayment = watch('paymentMethod');

  const onSubmit = async (data: CheckoutFormValues) => {
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const order = await OrderApi.createOrder(data, items);
      clearCart();
      router.push(`/checkout/success?orderNumber=${order.orderNumber}`);
    } catch (err) {
      console.error('Failed to create order', err);
      alert('Unable to process your order. Please check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-[#222222] mb-3">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add items to your cart before proceeding to checkout.</p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="bg-[#008ECC] text-white px-6 py-2.5 rounded-full font-semibold"
        >
          Return to Store
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center gap-2 pb-6 border-b border-gray-200 mb-8">
        <Lock className="w-5 h-5 text-[#008ECC]" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight">
          Secure Checkout
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Delivery Address & Payment */}
          <div className="lg:col-span-8 space-y-8">
            {/* 1. Delivery Details */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-7 shadow-xs">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#EBF6FA] flex items-center justify-center text-[#008ECC] font-bold text-sm">
                  1
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#222222]">Shipping Address</h2>
                  <p className="text-xs text-gray-500">Where should we deliver your order?</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    {...register('fullName')}
                    className="w-full bg-[#F9FBFD] border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#222222] outline-none focus:border-[#008ECC]"
                  />
                  {errors.fullName && (
                    <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="w-full bg-[#F9FBFD] border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#222222] outline-none focus:border-[#008ECC]"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address (for order tracking) *
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full bg-[#F9FBFD] border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#222222] outline-none focus:border-[#008ECC]"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Street Address / Apartment *
                  </label>
                  <input
                    type="text"
                    {...register('street')}
                    className="w-full bg-[#F9FBFD] border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#222222] outline-none focus:border-[#008ECC]"
                  />
                  {errors.street && (
                    <p className="text-xs text-red-500 mt-1">{errors.street.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    {...register('city')}
                    className="w-full bg-[#F9FBFD] border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#222222] outline-none focus:border-[#008ECC]"
                  />
                  {errors.city && (
                    <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      {...register('state')}
                      className="w-full bg-[#F9FBFD] border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#222222] outline-none focus:border-[#008ECC]"
                    />
                    {errors.state && (
                      <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">PIN *</label>
                    <input
                      type="text"
                      {...register('postalCode')}
                      className="w-full bg-[#F9FBFD] border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#222222] outline-none focus:border-[#008ECC]"
                    />
                    {errors.postalCode && (
                      <p className="text-xs text-red-500 mt-1">{errors.postalCode.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Payment Method */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-7 shadow-xs">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#EBF6FA] flex items-center justify-center text-[#008ECC] font-bold text-sm">
                  2
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#222222]">Payment Method</h2>
                  <p className="text-xs text-gray-500">Choose how you want to pay</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Cash on Delivery */}
                <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-[#008ECC] transition-colors">
                  <input
                    type="radio"
                    value="COD"
                    {...register('paymentMethod')}
                    className="w-4 h-4 text-[#008ECC]"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-sm text-[#222222]">
                      Cash on Delivery (COD)
                    </span>
                    <p className="text-xs text-gray-500">
                      Pay with cash or UPI upon package delivery
                    </p>
                  </div>
                </label>

                {/* Credit / Debit Card */}
                <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-[#008ECC] transition-colors">
                  <input
                    type="radio"
                    value="CARD"
                    {...register('paymentMethod')}
                    className="w-4 h-4 text-[#008ECC]"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-sm text-[#222222]">
                      Credit / Debit Card
                    </span>
                    <p className="text-xs text-gray-500">Visa, MasterCard, RuPay, Maestro</p>
                  </div>
                </label>

                {selectedPayment === 'CARD' && (
                  <div className="p-4 bg-[#F9FBFD] rounded-xl border border-gray-200 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="4532 1234 5678 9012"
                        {...register('cardNumber')}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#008ECC]"
                      />
                      {errors.cardNumber && (
                        <p className="text-xs text-red-500 mt-1">{errors.cardNumber.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* UPI */}
                <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-[#008ECC] transition-colors">
                  <input
                    type="radio"
                    value="UPI"
                    {...register('paymentMethod')}
                    className="w-4 h-4 text-[#008ECC]"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-sm text-[#222222]">
                      UPI (Google Pay, PhonePe, Paytm)
                    </span>
                    <p className="text-xs text-gray-500">Instant online UPI transfer</p>
                  </div>
                </label>

                {selectedPayment === 'UPI' && (
                  <div className="p-4 bg-[#F9FBFD] rounded-xl border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      UPI ID / VPA
                    </label>
                    <input
                      type="text"
                      placeholder="mobile@okhdfcbank"
                      {...register('upiId')}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#008ECC]"
                    />
                    {errors.upiId && (
                      <p className="text-xs text-red-500 mt-1">{errors.upiId.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-5 sticky top-20">
            <h3 className="text-base font-bold text-[#222222] pb-3 border-b border-gray-100">
              Order Review ({items.length} items)
            </h3>

            <div className="max-h-[220px] overflow-y-auto divide-y divide-gray-100 pr-1">
              {items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#F5F5F5] rounded-lg shrink-0 p-1 flex items-center justify-center">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#222222] truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[11px] text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-[#222222]">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-[#222222]">{formatPrice(subtotal)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-[#249B3E]">
                  <span>Total Savings</span>
                  <span className="font-semibold">- {formatPrice(savings)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Standard Delivery</span>
                <span className="text-[#249B3E] font-semibold">FREE</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-extrabold text-[#222222]">
                <span>Total Payable</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#008ECC] hover:bg-[#0077b0] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-70"
            >
              {submitting ? (
                <span>Placing Your Order...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Place Order ({formatPrice(subtotal)})</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 text-center">
              <ShieldCheck className="w-4 h-4 text-[#008ECC]" />
              <span>256-Bit SSL Secured Encryption</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
