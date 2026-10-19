'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, MessageCircle, Mail, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CatalogApi } from '@/lib/api/endpoints';
import { siteConfig } from '@/config/site';

export default function Footer() {
  const { contact } = siteConfig;
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => CatalogApi.getCategories(),
  });

  const links = [
    { name: 'Tất cả sản phẩm', href: '/products' },
    { name: 'Đăng nhập', href: '/auth/login' },
    { name: 'Đăng ký tài khoản', href: '/auth/register' },
  ];

  return (
    <footer className="w-full bg-[#008ECC] text-white pt-12 sm:pt-14 pb-8">
      <div className="max-w-[1240px] mx-auto px-4">
        {/* Main 3-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 pb-10 border-b border-white/20">
          {/* Column 1: Brand & Contact Info */}
          <div className="md:col-span-5 flex flex-col">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">{siteConfig.name}</h2>
            <p className="text-[13px] text-white/85 mb-5 max-w-[380px]">{siteConfig.tagline}</p>

            <div className="space-y-3 text-[13px] sm:text-[14px]">
              <h3 className="font-semibold text-white/95 text-base">Liên hệ</h3>

              <div className="flex items-center gap-2.5 text-white/90">
                <Phone className="w-4 h-4 text-white shrink-0" />
                <span>Hotline:</span>
                <a href={contact.hotlineHref} className="font-medium hover:underline text-white">
                  {contact.hotline}
                </a>
              </div>

              <div className="flex items-center gap-2.5 text-white/90">
                <MessageCircle className="w-4 h-4 text-white shrink-0" />
                <span>Zalo:</span>
                <a href={contact.zaloHref} target="_blank" rel="noreferrer" className="font-medium hover:underline text-white">
                  {contact.hotline}
                </a>
              </div>

              <div className="flex items-center gap-2.5 text-white/90">
                <Mail className="w-4 h-4 text-white shrink-0" />
                <span>Email:</span>
                <a href={`mailto:${contact.email}`} className="font-medium hover:underline text-white">
                  {contact.email}
                </a>
              </div>

              <div className="flex items-center gap-2.5 text-white/90">
                <MapPin className="w-4 h-4 text-white shrink-0" />
                <span>{contact.address}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Categories */}
          <div className="md:col-span-4">
            <h3 className="text-base sm:text-lg font-bold mb-4 pb-1 relative inline-block">
              Danh mục sản phẩm
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-full" />
            </h3>
            <ul className="space-y-2 text-[13px] sm:text-[14px] text-white/90">
              {categories.map((cat) => (
                <li key={cat.slug} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                  <Link href={`/category/${cat.slug}`} className="hover:underline hover:text-white transition-colors">
                    {cat.name} ({cat.itemCount})
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Quick links */}
          <div className="md:col-span-3">
            <h3 className="text-base sm:text-lg font-bold mb-4 pb-1 relative inline-block">
              Liên kết nhanh
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-full" />
            </h3>
            <ul className="space-y-2 text-[13px] sm:text-[14px] text-white/90">
              {links.map((link) => (
                <li key={link.href} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                  <Link href={link.href} className="hover:underline hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-6 text-center text-xs sm:text-sm text-white/80">
          <p>© {new Date().getFullYear()} {siteConfig.name}. Bảo lưu mọi quyền.</p>
        </div>
      </div>
    </footer>
  );
}
