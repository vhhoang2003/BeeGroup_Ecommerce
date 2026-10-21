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
  'flex items-center justify-between py-2 text-sm text-ink hover:text-honey-700 font-medium transition-colors';

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const t = useTranslations('nav');
  const { user, isAuthenticated } = useAuthStore();
  const { data: categories = [] } = useCategories();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-[290px] bg-white shadow-xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200 overflow-y-auto">
        <div>
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-paper">
            <Logo />
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-500 hover:text-slate-800"
              aria-label={t('closeMenu')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Status */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ink/10 flex items-center justify-center text-honey-700">
              <User className="w-5 h-5" />
            </div>
            <div>
              {isAuthenticated && user ? (
                <>
                  <p className="text-sm font-semibold text-ink">{user.fullName}</p>
                  <Link href="/account" onClick={onClose} className="text-xs text-honey-700 font-medium hover:underline">
                    {t('myAccount')}
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-ink">{t('hello')}</p>
                  <Link
                    href="/auth/login"
                    onClick={onClose}
                    className="text-xs text-honey-700 font-medium hover:underline"
                  >
                    {t('loginOrRegister')}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Category List */}
          <div className="p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('categories')}</h4>
            <div className="space-y-1">
              {categories.map((c) => (
                <Link key={c.slug} href={`/category/${c.slug}`} onClick={onClose} className={rowClass}>
                  <span className="flex items-center gap-2.5">
                    <CategoryIcon slug={c.slug} className="w-4 h-4 text-honey-700" />
                    {c.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              ))}
              <Link href="/products" onClick={onClose} className={rowClass}>
                <span className="flex items-center gap-2.5">
                  <LayoutGrid className="w-4 h-4 text-honey-700" />
                  {t('allProducts')}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link href="/cart" onClick={onClose} className={rowClass}>
                <span className="flex items-center gap-2.5">
                  <ShoppingCart className="w-4 h-4 text-honey-700" />
                  {t('cart')}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link href="/about" onClick={onClose} className={rowClass}>
                <span className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-honey-700" />
                  {t('about')}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link href="/contact" onClick={onClose} className={rowClass}>
                <span className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-honey-700" />
                  {t('contact')}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              {user?.role === 'ADMIN' && (
                <Link href="/admin" onClick={onClose} className={rowClass}>
                  <span className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-honey-700" />
                    {t('admin')}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2.5 text-xs text-slate-600">
          <LanguageSwitcher className="w-fit" />
          <a href={siteConfig.contact.hotlineHref} className="flex items-center gap-2 hover:text-honey-700">
            <Phone className="w-4 h-4 text-honey-700" />
            <span>Hotline {siteConfig.contact.hotline}</span>
          </a>
          <a
            href={siteConfig.contact.zaloHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 hover:text-honey-700"
          >
            <MessageCircle className="w-4 h-4 text-honey-700" />
            <span>{t('chatZalo')}</span>
          </a>
          <a
            href={siteConfig.contact.whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 hover:text-honey-700"
          >
            <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
