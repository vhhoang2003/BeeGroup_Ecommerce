'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Phone, User as UserIcon } from 'lucide-react';
import SearchSuggestions from '@/features/catalog/components/SearchSuggestions';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import Logo from '@/components/ui/Logo';
import { siteConfig } from '@/config/site';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export default function Header({ onToggleMobileMenu }: HeaderProps) {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <header className="w-full bg-white border-b border-[#EDEDED] sticky top-0 z-40">
      <div className="max-w-[1240px] mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu + Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Mở menu"
            className="w-10 h-10 rounded-[8px] bg-[#F3F9FB] flex items-center justify-center text-[#008ECC] hover:bg-[#E2F2F9] transition-colors cursor-pointer md:hidden"
          >
            <Menu className="w-5 h-5 text-[#008ECC]" />
          </button>

          <Link href="/" className="flex items-center group" aria-label={`${siteConfig.name}, trang chủ`}>
            <Logo className="transition-transform group-hover:scale-[1.02]" />
          </Link>
        </div>

        {/* Center: Search input */}
        <div className="flex-1 hidden md:flex justify-center px-4">
          <SearchSuggestions />
        </div>

        {/* Right: Auth + Hotline */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          {isAuthenticated && user ? (
            <Link
              href="/account"
              className="flex items-center gap-2 text-[13px] sm:text-[14px] font-medium text-[#222222] hover:text-[#008ECC] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#EBF6FA] flex items-center justify-center text-[#008ECC]">
                <UserIcon className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline truncate max-w-[110px]">{user.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 text-[13px] sm:text-[14px] font-medium text-[#222222] hover:text-[#008ECC] transition-colors"
            >
              <UserIcon className="w-[18px] h-[18px] text-[#008ECC]" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </Link>
          )}

          <div className="w-px h-5 bg-[#EDEDED] hidden sm:block" />

          <a
            href={siteConfig.contact.hotlineHref}
            className="flex items-center gap-2 text-[13px] sm:text-[14px] font-semibold text-white bg-[#008ECC] hover:bg-[#0077b0] px-3 sm:px-4 py-2 rounded-full transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Gọi tư vấn</span>
          </a>
        </div>
      </div>

      {/* Mobile search bar visible on small screens */}
      <div className="md:hidden px-4 pb-3">
        <SearchSuggestions />
      </div>
    </header>
  );
}
