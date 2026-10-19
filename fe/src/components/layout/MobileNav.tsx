'use client';

import React from 'react';
import Link from 'next/link';
import { X, Phone, MessageCircle, User, ChevronRight, LayoutGrid } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { CatalogApi } from '@/lib/api/endpoints';
import CategoryIcon from '@/features/catalog/components/CategoryIcon';
import Logo from '@/components/ui/Logo';
import { siteConfig } from '@/config/site';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => CatalogApi.getCategories(),
  });

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
            <Logo />
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-800"
              aria-label="Đóng menu"
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
                    Tài khoản của tôi
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin/products"
                      onClick={onClose}
                      className="ml-3 text-xs text-[#008ECC] font-medium hover:underline"
                    >
                      Quản trị
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#222222]">Xin chào</p>
                  <Link
                    href="/auth/login"
                    onClick={onClose}
                    className="text-xs text-[#008ECC] font-medium hover:underline"
                  >
                    Đăng nhập hoặc đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Category List */}
          <div className="p-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Danh mục</h4>
            <div className="space-y-1">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-between py-2 text-sm text-[#222222] hover:text-[#008ECC] font-medium transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <CategoryIcon slug={c.slug} className="w-4 h-4 text-[#008ECC]" />
                    {c.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              ))}
              <Link
                href="/products"
                onClick={onClose}
                className="flex items-center justify-between py-2 text-sm text-[#222222] hover:text-[#008ECC] font-medium transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <LayoutGrid className="w-4 h-4 text-[#008ECC]" />
                  Tất cả sản phẩm
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-2.5 text-xs text-gray-600">
          <a href={siteConfig.contact.hotlineHref} className="flex items-center gap-2 hover:text-[#008ECC]">
            <Phone className="w-4 h-4 text-[#008ECC]" />
            <span>Hotline {siteConfig.contact.hotline}</span>
          </a>
          <a
            href={siteConfig.contact.zaloHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 hover:text-[#008ECC]"
          >
            <MessageCircle className="w-4 h-4 text-[#008ECC]" />
            <span>Chat Zalo</span>
          </a>
        </div>
      </div>
    </div>
  );
}
