'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Headset, MessageCircle, MessagesSquare, Phone, X } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { usePathname } from '@/i18n/navigation';

/** Floating Zalo / Messenger / phone shortcuts on every public page (ENG-07). */
export default function FloatingContact() {
  const t = useTranslations('floating');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { contact } = siteConfig;

  if (pathname.startsWith('/admin')) return null;

  const items = [
    { href: contact.zaloHref, label: 'Zalo', icon: MessageCircle, external: true, color: 'bg-[#0068FF]' },
    { href: contact.messengerHref, label: 'Messenger', icon: MessagesSquare, external: true, color: 'bg-[#0084FF]' },
    { href: contact.hotlineHref, label: contact.hotline, icon: Phone, external: false, color: 'bg-emerald-600' },
  ];

  return (
    <div className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-40 flex flex-col items-end gap-2.5">
      {open && (
        <ul className="flex flex-col items-end gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {items.map(({ href, label, icon: Icon, external, color }) => (
            <li key={label}>
              <a
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                className="flex items-center gap-2 bg-white shadow-lg border border-gray-100 rounded-full pl-3 pr-1 py-1 text-[13px] font-semibold text-[#222222] hover:text-[#008ECC]"
              >
                <span>{label}</span>
                <span className={`w-9 h-9 rounded-full ${color} text-white flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t('close') : t('open')}
        className="w-14 h-14 rounded-full bg-[#008ECC] hover:bg-[#0077b0] text-white shadow-xl flex items-center justify-center transition-colors cursor-pointer"
      >
        {open ? <X className="w-6 h-6" /> : <Headset className="w-6 h-6" />}
      </button>
    </div>
  );
}
