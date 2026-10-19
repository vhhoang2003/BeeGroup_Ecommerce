'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, MapPin, Truck, Tag, User, ChevronRight } from 'lucide-react';
import { mockNavPills } from '@/lib/mocks/data';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-[290px] bg-white shadow-xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
        <div>
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#F3F9FB]">
            <Image
              src="/images/megamart_logo.png"
              alt="MegaMart Logo"
              width={130}
              height={26}
              className="h-6 w-auto object-contain"
            />
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-800"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Status */}
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#008ECC]/10 flex items-center justify-center text-[#008ECC]">
              <User className="w-5 h-5" />
            </div>
            <div>
              {isAuthenticated && user ? (
                <>
                  <p className="text-sm font-semibold text-[#222222]">{user.name}</p>
                  <Link
                    href="/account"
                    onClick={onClose}
                    className="text-xs text-[#008ECC] font-medium hover:underline"
                  >
                    View Account
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#222222]">Welcome Guest</p>
                  <Link
                    href="/auth/login"
                    onClick={onClose}
                    className="text-xs text-[#008ECC] font-medium hover:underline"
                  >
                    Sign In or Register
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Category List */}
          <div className="p-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Departments
            </h4>
            <div className="space-y-1">
              {mockNavPills.map((pill) => (
                <Link
                  key={pill.slug}
                  href={`/category/${pill.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-between py-2 text-sm text-[#222222] hover:text-[#008ECC] font-medium transition-colors"
                >
                  <span>{pill.name}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-2.5 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#008ECC]" />
            <span>Deliver to 423651</span>
          </div>
          <Link
            href="/account?tab=orders"
            onClick={onClose}
            className="flex items-center gap-2 hover:text-[#008ECC]"
          >
            <Truck className="w-4 h-4 text-[#008ECC]" />
            <span>Track your order</span>
          </Link>
          <Link
            href="/products?discount=true"
            onClick={onClose}
            className="flex items-center gap-2 hover:text-[#008ECC]"
          >
            <Tag className="w-4 h-4 text-[#008ECC]" />
            <span>All Offers</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
