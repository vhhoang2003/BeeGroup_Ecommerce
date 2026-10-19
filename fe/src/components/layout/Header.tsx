'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, User as UserIcon, ShoppingBag } from 'lucide-react';
import SearchSuggestions from '@/features/catalog/components/SearchSuggestions';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export default function Header({ onToggleMobileMenu }: HeaderProps) {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const toggleCart = useCartStore((state) => state.toggleCart);
  const { user, isAuthenticated } = useAuthStore();

  return (
    <header className="w-full bg-white border-b border-[#EDEDED] sticky top-0 z-40">
      <div className="max-w-[1240px] mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu + MegaMart Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Open Navigation Menu"
            className="w-10 h-10 rounded-[8px] bg-[#F3F9FB] flex items-center justify-center text-[#008ECC] hover:bg-[#E2F2F9] transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5 text-[#008ECC]" />
          </button>

          <Link href="/" className="flex items-center gap-1.5 group">
            <Image
              src="/images/megamart_logo.png"
              alt="MegaMart Logo"
              width={160}
              height={30}
              priority
              className="h-7 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </Link>
        </div>

        {/* Center: Search input */}
        <div className="flex-1 hidden md:flex justify-center px-4">
          <SearchSuggestions />
        </div>

        {/* Right: Auth + Cart */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          {/* User Sign In / Account */}
          {isAuthenticated && user ? (
            <Link
              href="/account"
              className="flex items-center gap-2 text-[13px] sm:text-[14px] font-medium text-[#222222] hover:text-[#008ECC] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#EBF6FA] flex items-center justify-center text-[#008ECC]">
                <UserIcon className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline truncate max-w-[110px]">
                {user.name.split(' ')[0]}
              </span>
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 text-[13px] sm:text-[14px] font-medium text-[#222222] hover:text-[#008ECC] transition-colors"
            >
              <UserIcon className="w-[18px] h-[18px] text-[#008ECC]" />
              <span className="hidden sm:inline">Sign Up/Sign In</span>
            </Link>
          )}

          <div className="w-px h-5 bg-[#EDEDED] hidden sm:block" />

          {/* Cart Button */}
          <button
            type="button"
            onClick={toggleCart}
            aria-label={`Shopping cart with ${totalItems} items`}
            className="flex items-center gap-2 text-[13px] sm:text-[14px] font-medium text-[#222222] hover:text-[#008ECC] transition-colors cursor-pointer relative"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-[#008ECC]" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#008ECC] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Cart</span>
          </button>
        </div>
      </div>

      {/* Mobile search bar visible on small screens */}
      <div className="md:hidden px-4 pb-3">
        <SearchSuggestions />
      </div>
    </header>
  );
}
