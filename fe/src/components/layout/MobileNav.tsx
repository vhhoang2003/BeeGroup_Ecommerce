'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { X, Phone, MessageCircle, User, ChevronRight, LayoutGrid, Mail, ShieldCheck, ShoppingCart, Info } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useCategories } from '@/features/catalog/hooks';
import CategoryIcon from '@/features/catalog/components/CategoryIcon';
import Logo from '@/components/ui/Logo';
import { Link } from '@/i18n/navigation';
import { siteConfig } from '@/config/site';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import LanguageSwitcher from './LanguageSwitcher';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const rowClass =
  'flex items-center justify-between py-2.5 px-3 rounded-xl min-h-[44px] text-sm text-slate-700 hover:text-ink hover:bg-honey-50/70 font-semibold transition-colors';

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const t = useTranslations('nav');
  const { user, isAuthenticated } = useAuthStore();
  const { data: categories = [] } = useCategories();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-[300px] max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200 overflow-y-auto">
        <div>
          {/* Header */}
          <div className="p-4 border-b border-line flex items-center justify-between bg-paper">
            <Logo />
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center text-slate-500 hover:text-ink hover:bg-slate-200/60 transition-colors"
              aria-label={t('closeMenu')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Status Card */}
          <div className="p-4 border-b border-line bg-gradient-to-r from-paper to-white flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-honey-100 border border-honey-300 flex items-center justify-center text-honey-800 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              {isAuthenticated && user ? (
                <>
                  <p className="text-sm font-bold text-ink truncate">{user.fullName}</p>
                  <Link
                    href="/account"
                    onClick={onClose}
                    className="inline-block text-xs text-honey-700 font-semibold hover:underline mt-0.5"
                  >
                    {t('myAccount')} &rarr;
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-ink">{t('hello')}</p>
                  <Link
                    href="/auth/login"
                    onClick={onClose}
                    className="inline-block text-xs text-honey-700 font-semibold hover:underline mt-0.5"
                  >
                    {t('loginOrRegister')} &rarr;
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Category List */}
          <div className="p-3">
            <div className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>{t('categories')}</span>
            </div>
            <div className="space-y-0.5">
              {categories.map((c) => (
                <Link key={c.slug} href={`/category/${c.slug}`} onClick={onClose} className={rowClass}>
                  <span className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-paper border border-line flex items-center justify-center">
                      <CategoryIcon slug={c.slug} className="w-4 h-4 text-honey-700" />
                    </div>
                    <span>{c.name}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              ))}

              <div className="my-2 border-t border-line/60" />

              <Link href="/products" onClick={onClose} className={rowClass}>
                <span className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-paper border border-line flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4 text-honey-700" />
                  </div>
                  <span>{t('allProducts')}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link href="/cart" onClick={onClose} className={rowClass}>
                <span className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-paper border border-line flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-honey-700" />
                  </div>
                  <span>{t('cart')}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link href="/about" onClick={onClose} className={rowClass}>
                <span className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-paper border border-line flex items-center justify-center">
                    <Info className="w-4 h-4 text-honey-700" />
                  </div>
                  <span>{t('about')}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link href="/contact" onClick={onClose} className={rowClass}>
                <span className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-paper border border-line flex items-center justify-center">
                    <Mail className="w-4 h-4 text-honey-700" />
                  </div>
                  <span>{t('contact')}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              {user?.role === 'ADMIN' && (
                <Link href="/admin" onClick={onClose} className={rowClass}>
                  <span className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-honey-50 border border-honey-200 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-honey-700" />
                    </div>
                    <span>{t('admin')}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="p-4 border-t border-line bg-paper space-y-3 text-xs text-slate-700">
          <LanguageSwitcher tone="light" className="w-fit" />

          <a
            href={siteConfig.contact.hotlineHref}
            className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-line min-h-[44px] font-semibold text-ink hover:border-honey-500 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-honey flex items-center justify-center text-ink shrink-0">
              <Phone className="w-4 h-4 fill-current" />
            </div>
            <span>Hotline: {siteConfig.contact.hotline}</span>
          </a>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={siteConfig.contact.zaloHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white border border-line min-h-[44px] font-semibold text-slate-700 hover:text-honey-700 hover:border-honey-300 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-honey-700 shrink-0" />
              <span>{t('chatZalo')}</span>
            </a>
            <a
              href={siteConfig.contact.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white border border-line min-h-[44px] font-semibold text-slate-700 hover:text-emerald-600 hover:border-emerald-300 transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
