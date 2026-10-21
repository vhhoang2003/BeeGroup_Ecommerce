'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Heart, Menu, Phone, ShieldCheck, User as UserIcon } from 'lucide-react';
import SearchSuggestions from '@/features/catalog/components/SearchSuggestions';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import CartButton from '@/features/cart/components/CartButton';
import Logo from '@/components/ui/Logo';
import { Link } from '@/i18n/navigation';
import { siteConfig } from '@/config/site';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export default function Header({ onToggleMobileMenu }: HeaderProps) {
  const t = useTranslations('nav');
  const { user, isAuthenticated } = useAuthStore();

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-line sticky top-0 z-40 shadow-xs transition-shadow">
      <div className="max-w-[1240px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu + Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label={t('openMenu')}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-paper border border-line flex items-center justify-center text-ink hover:text-honey-700 hover:bg-honey-50/70 transition-all cursor-pointer md:hidden focus-visible:outline-2 focus-visible:outline-honey-500"
          >
            <Menu className="w-5 h-5 text-ink" />
          </button>

          <Link
            href="/"
            className="flex items-center group py-1"
            aria-label={t('homeOf', { name: siteConfig.name })}
          >
            <Logo className="transition-transform duration-200 group-hover:scale-[1.02]" />
          </Link>
        </div>

        {/* Center: Search input */}
        <div className="flex-1 hidden md:flex justify-center max-w-[560px] px-2">
          <SearchSuggestions />
        </div>

        {/* Right: Admin + Wishlist + Auth + Hotline */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-1.5 text-[13px] font-bold text-honey-700 bg-honey-50 hover:bg-honey-100 px-3 py-1.5 rounded-full transition-colors border border-honey-200 min-h-[40px]"
            >
              <ShieldCheck className="w-4 h-4 text-honey-700" />
              <span>{t('admin')}</span>
            </Link>
          )}

          {isAuthenticated && (
            <Link
              href="/account/wishlist"
              aria-label={t('wishlist')}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl hover:bg-paper border border-transparent hover:border-line flex items-center justify-center text-slate-600 hover:text-rose-600 transition-colors"
            >
              <Heart className="w-[19px] h-[19px]" />
            </Link>
          )}

          <div className="flex items-center">
            <CartButton />
          </div>

          {isAuthenticated && user ? (
            <Link
              href="/account"
              className="flex items-center gap-2 text-[13px] sm:text-[14px] font-semibold text-ink hover:text-honey-700 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-paper min-h-[40px]"
            >
              <div className="w-7 h-7 rounded-full bg-honey-100 text-honey-800 border border-honey-300 flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline truncate max-w-[110px]">{user.fullName}</span>
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 text-[13px] sm:text-[14px] font-semibold text-slate-700 hover:text-ink transition-colors px-3 py-2 rounded-xl hover:bg-paper min-h-[40px]"
            >
              <UserIcon className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">{t('login')}</span>
            </Link>
          )}

          <div className="w-px h-5 bg-line hidden sm:block" />

          <a
            href={siteConfig.contact.hotlineHref}
            className="flex items-center gap-2 text-[13px] sm:text-[14px] font-bold text-white bg-ink hover:bg-ink-800 px-3.5 sm:px-4 py-2 rounded-full min-h-[40px] transition-all shadow-xs hover:shadow-sm"
          >
            <div className="w-5 h-5 rounded-full bg-honey flex items-center justify-center shrink-0">
              <Phone className="w-3 h-3 text-ink fill-current" />
            </div>
            <span className="hidden sm:inline">{t('callUs')}</span>
          </a>
        </div>
      </div>

      {/* Mobile search bar visible on small screens */}
      <div className="md:hidden px-4 pb-3 pt-1">
        <SearchSuggestions />
      </div>
    </header>
  );
}
