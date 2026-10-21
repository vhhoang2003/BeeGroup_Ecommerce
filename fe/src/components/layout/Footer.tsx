'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Phone, MessageCircle, Mail, MapPin, Truck } from 'lucide-react';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { Link } from '@/i18n/navigation';
import { useCategories } from '@/features/catalog/hooks';
import { siteConfig } from '@/config/site';
import Logo from '@/components/ui/Logo';
import { OrbitPattern } from '@/components/ui/BrandDecorations';

export default function Footer() {
  const t = useTranslations('footer');
  const tSite = useTranslations('site');
  const tNav = useTranslations('nav');
  const { contact } = siteConfig;
  const { data: categories = [] } = useCategories();

  const links = [
    { name: tNav('allProducts'), href: '/products' },
    { name: tNav('about'), href: '/about' },
    { name: tNav('contact'), href: '/contact' },
    { name: tNav('login'), href: '/auth/login' },
    { name: tNav('register'), href: '/auth/register' },
    { name: t('privacy'), href: '/privacy' },
    { name: t('terms'), href: '/terms' },
  ];

  return (
    <footer className="w-full bg-ink text-white relative overflow-hidden">
      {/* Top Gold Gradient Accent Line */}
      <div className="w-full h-[3px] bg-honey-gradient" />

      {/* Subtle Background Orbit Watermark */}
      <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none translate-x-1/4 translate-y-1/4 w-[600px] h-[300px]">
        <OrbitPattern />
      </div>

      <div className="max-w-[1240px] mx-auto px-4 pt-12 sm:pt-16 pb-8 relative z-10">
        {/* Main 3-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 sm:gap-12 pb-12 border-b border-white/10">
          {/* Column 1: Brand & Contact Info */}
          <div className="md:col-span-5 flex flex-col">
            <div className="mb-4">
              <Logo tone="light" size="lg" />
            </div>
            <p className="text-[13px] sm:text-[14px] text-slate-300 mb-6 max-w-[400px] leading-relaxed">
              {tSite('tagline')}
            </p>

            <div className="space-y-3.5 text-[13px] sm:text-[14px]">
              <h3 className="font-bold text-white text-base tracking-tight mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-[2px] bg-honey rotate-45" />
                <span>{t('contact')}</span>
              </h3>

              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5 text-honey" />
                </div>
                <span>Hotline:</span>
                <a href={contact.hotlineHref} className="font-bold text-white hover:text-honey transition-colors">
                  {contact.hotline}
                </a>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-3.5 h-3.5 text-honey" />
                </div>
                <span>Zalo:</span>
                <a
                  href={contact.zaloHref}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-white hover:text-honey transition-colors"
                >
                  {contact.hotline}
                </a>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                </div>
                <span>WhatsApp:</span>
                <a
                  href={contact.whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-white hover:text-honey transition-colors"
                >
                  {contact.hotline}
                </a>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-honey" />
                </div>
                <span>Email:</span>
                <a href={`mailto:${contact.email}`} className="font-medium text-white hover:text-honey transition-colors">
                  {contact.email}
                </a>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-honey" />
                </div>
                <span>{tSite('address')}</span>
              </div>

              <div className="flex items-start gap-3 text-white/95 pt-2">
                <div className="w-7 h-7 rounded-lg bg-honey/20 border border-honey/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Truck className="w-3.5 h-3.5 text-honey" />
                </div>
                <span className="font-medium text-slate-200 leading-snug">{tSite('delivery')}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Categories */}
          <div className="md:col-span-4">
            <h3 className="text-base sm:text-lg font-bold mb-4 pb-2 relative inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-[2px] bg-honey rotate-45" />
              <span>{t('categories')}</span>
              <span className="absolute bottom-0 left-0 w-12 h-[2px] bg-honey-gradient rounded-full" />
            </h3>
            <ul className="space-y-2.5 text-[13px] sm:text-[14px] text-slate-300">
              {categories.map((cat) => (
                <li key={cat.slug} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-honey/70 shrink-0" />
                  <Link href={`/category/${cat.slug}`} className="hover:text-honey hover:translate-x-1 transition-all">
                    {cat.name} <span className="text-slate-400 text-xs">({cat.itemCount})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Quick links */}
          <div className="md:col-span-3">
            <h3 className="text-base sm:text-lg font-bold mb-4 pb-2 relative inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-[2px] bg-honey rotate-45" />
              <span>{t('quickLinks')}</span>
              <span className="absolute bottom-0 left-0 w-12 h-[2px] bg-honey-gradient rounded-full" />
            </h3>
            <ul className="space-y-2.5 text-[13px] sm:text-[14px] text-slate-300">
              {links.map((link) => (
                <li key={link.href} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-honey/70 shrink-0" />
                  <Link href={link.href} className="hover:text-honey hover:translate-x-1 transition-all">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>{t('rights', { year: new Date().getFullYear(), name: siteConfig.name })}</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-honey transition-colors">
              {t('privacy')}
            </Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-honey transition-colors">
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
