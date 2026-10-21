'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Mail, MessageCircle, Phone, Truck } from 'lucide-react';
import { siteConfig } from '@/config/site';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import LanguageSwitcher from './LanguageSwitcher';

export default function TopUtilityBar() {
  const t = useTranslations('site');
  const { contact } = siteConfig;

  return (
    <div className="w-full bg-slate-100 border-b border-line text-[13px] sm:text-[14px] text-muted">
      <div className="max-w-[1240px] mx-auto px-4 py-2.5 flex items-center justify-between gap-4 min-h-[48px]">
        {/* Delivery promise */}
        <div className="flex items-center gap-2 min-w-0 font-medium text-ink" title={t('delivery')}>
          <Truck className="w-4 h-4 text-honey-700 shrink-0" />
          <span className="truncate">{t('deliveryShort')}</span>
        </div>

        {/* Right utility links */}
        <div className="flex items-center gap-5 shrink-0">
          <a href={contact.hotlineHref} className="hidden md:flex items-center gap-2 hover:text-honey-700 transition-colors">
            <Phone className="w-4 h-4 text-honey-700" />
            <span className="font-semibold text-ink">{contact.hotline}</span>
          </a>

          <a
            href={contact.zaloHref}
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-2 hover:text-honey-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-honey-700" />
            <span>Zalo</span>
          </a>

          <a
            href={contact.whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-2 hover:text-honey-700 transition-colors"
          >
            <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
            <span>WhatsApp</span>
          </a>

          <a
            href={`mailto:${contact.email}`}
            className="hidden 2xl:flex items-center gap-2 hover:text-honey-700 transition-colors"
          >
            <Mail className="w-4 h-4 text-honey-700" />
            <span>{contact.email}</span>
          </a>

          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
