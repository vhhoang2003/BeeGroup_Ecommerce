'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Package,
  MapPin,
  LogOut,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { formatPrice } from '@/lib/utils';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses'>('orders');

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-[500px] mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#EBF6FA] text-[#008ECC] flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#222222] mb-2">Sign In Required</h2>
        <p className="text-sm text-gray-500 mb-6">
          Please log in to your account to view your past orders, delivery tracking, and addresses.
        </p>
        <Link
          href="/auth/login"
          className="inline-block bg-[#008ECC] hover:bg-[#0077b0] text-white px-8 py-3 rounded-full font-bold text-sm shadow-md transition-all"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 sm:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#008ECC] text-white flex items-center justify-center text-xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222]">
              {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">{user.email} • {user.phone}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors w-fit"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Navigation Tabs */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-gray-200/80 p-3 shadow-xs space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'orders'
                ? 'bg-[#EBF6FA] text-[#008ECC]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders (1)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('addresses')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'addresses'
                ? 'bg-[#EBF6FA] text-[#008ECC]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Delivery Addresses</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'bg-[#EBF6FA] text-[#008ECC]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Settings</span>
          </button>
        </div>

        {/* Right: Tab Content */}
        <div className="md:col-span-9 bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-lg font-bold text-[#222222] mb-4">
                Recent Orders
              </h2>

              <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-200">
                <div className="bg-[#F8FAFB] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-600">
                  <div className="flex gap-6">
                    <div>
                      <span className="block text-gray-400">Order Placed</span>
                      <span className="font-semibold text-[#222222]">Today</span>
                    </div>
                    <div>
                      <span className="block text-gray-400">Total</span>
                      <span className="font-semibold text-[#222222]">{formatPrice(10499)}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400">Ship To</span>
                      <span className="font-semibold text-[#222222]">{user.name}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Order # </span>
                    <span className="font-mono font-bold text-[#008ECC]">ORD-423651</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#F5F5F5] rounded-xl p-2 shrink-0 flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-[#008ECC]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Confirmed & Processing
                      </span>
                      <h4 className="text-sm font-bold text-[#222222] mt-1">
                        Galaxy M13 (4GB | 64 GB )
                      </h4>
                      <p className="text-xs text-gray-500">
                        Estimated Delivery by Friday, 24 Oct
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/checkout/success?orderNumber=ORD-423651"
                    className="text-xs font-semibold text-[#008ECC] hover:underline flex items-center gap-1"
                  >
                    <span>Track Package</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div>
              <h2 className="text-lg font-bold text-[#222222] mb-4">
                Saved Delivery Addresses
              </h2>

              <div className="p-5 rounded-2xl border-2 border-[#008ECC] bg-[#F9FCFE] relative max-w-md">
                <span className="absolute top-4 right-4 bg-[#008ECC] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  DEFAULT
                </span>
                <p className="text-sm font-bold text-[#222222] mb-1">
                  {user.address?.fullName || user.name}
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {user.address?.street}<br />
                  {user.address?.city}, {user.address?.state} - {user.address?.postalCode}<br />
                  Phone: {user.address?.phone}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-md space-y-4">
              <h2 className="text-lg font-bold text-[#222222] mb-4">
                Personal Information
              </h2>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                <input
                  type="text"
                  disabled
                  value={user.name}
                  className="w-full bg-[#F5F5F5] border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-[#222222]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-[#F5F5F5] border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-[#222222]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
                <input
                  type="text"
                  disabled
                  value={user.role}
                  className="w-full bg-[#F5F5F5] border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-[#222222]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
