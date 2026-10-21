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
    <div className="w-full bg-ink border-b border-white/10 text-[12px] sm:text-[13px] text-slate-300">
      <div className="max-w-[1240px] mx-auto px-4 flex items-center justify-between gap-4 min-h-[42px]">
        {/* Delivery promise */}
        <div className="flex items-center gap-2 min-w-0 font-medium text-white/95 py-1" title={t('delivery')}>
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Truck className="w-3.5 h-3.5 text-honey shrink-0" />
          </div>
          <span className="truncate">{t('deliveryShort')}</span>
        </div>

        {/* Right utility links */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <a
            href={contact.hotlineHref}
            className="hidden md:flex items-center gap-1.5 hover:text-honey transition-colors min-h-[40px] py-1"
          >
            <Phone className="w-3.5 h-3.5 text-honey" />
            <span className="font-bold text-white tracking-wide">{contact.hotline}</span>
          </a>

          <a
            href={contact.zaloHref}
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-1.5 hover:text-white transition-colors min-h-[40px] py-1"
          >
            <MessageCircle className="w-3.5 h-3.5 text-honey" />
            <span>Zalo</span>
          </a>

          <a
            href={contact.whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-1.5 hover:text-white transition-colors min-h-[40px] py-1"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
            <span>WhatsApp</span>
          </a>

          <a
            href={`mailto:${contact.email}`}
            className="hidden 2xl:flex items-center gap-1.5 hover:text-white transition-colors min-h-[40px] py-1"
          >
            <Mail className="w-3.5 h-3.5 text-honey" />
            <span>{contact.email}</span>
          </a>

          <div className="flex items-center min-h-[40px]">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}
