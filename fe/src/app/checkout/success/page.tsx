'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Package, Home } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || 'ORD-982145';

  return (
    <div className="max-w-[700px] mx-auto px-4 py-16 sm:py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-xs animate-in zoom-in">
        <CheckCircle className="w-10 h-10" />
      </div>

      <span className="text-xs uppercase tracking-wider font-bold text-[#008ECC] bg-[#EBF6FA] px-3 py-1 rounded-full">
        Order Placed Successfully
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#222222] tracking-tight mt-3 mb-2">
        Thank You For Your Order!
      </h1>

      <p className="text-sm text-gray-500 mb-8">
        We have received your order and our fulfillment team has started preparing your package.
      </p>

      {/* Order Info Card */}
      <div className="bg-[#F8FAFB] border border-gray-200/80 rounded-2xl p-6 text-left mb-8 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-200 text-sm">
          <span className="text-gray-500">Order Reference</span>
          <span className="font-mono font-bold text-[#222222]">{orderNumber}</span>
        </div>

        <div className="flex justify-between items-center pb-3 border-b border-gray-200 text-sm">
          <span className="text-gray-500">Estimated Delivery</span>
          <span className="font-semibold text-emerald-600">Within 3-4 Business Days</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Payment Status</span>
          <span className="font-semibold text-[#008ECC]">Confirmed</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#008ECC] hover:bg-[#0077b0] text-white px-7 py-3 rounded-full font-bold text-sm shadow-md transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Back to Homepage</span>
        </Link>

        <Link
          href="/account?tab=orders"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-gray-300 hover:border-[#008ECC] hover:text-[#008ECC] text-[#222222] px-7 py-3 rounded-full font-semibold text-sm transition-all"
        >
          <Package className="w-4 h-4" />
          <span>Track Order</span>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading confirmation...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
