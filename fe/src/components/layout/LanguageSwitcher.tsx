'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Globe } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { LOCALE_LABELS, routing } from '@/i18n/routing';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { MeApi } from '@/lib/api/endpoints';
import type { Locale } from '@/types/product';
import { cn } from '@/lib/utils';

/** Switches the URL locale prefix (kept in the NEXT_LOCALE cookie) and the profile's preferred language. */
export default function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations('nav');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const choose = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;
    if (isAuthenticated) MeApi.update({ preferredLocale: next }).catch(() => undefined);
    // Read the query at click time so the switcher does not need a Suspense boundary for useSearchParams.
    router.replace(`${pathname}${window.location.search}`, { locale: next });
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language')}
        className="flex items-center gap-1.5 hover:text-[#008ECC] transition-colors cursor-pointer"
      >
        <Globe className="w-3.5 h-3.5 text-[#008ECC]" />
        <span>{LOCALE_LABELS[locale]}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t('language')}
          className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 text-[13px] text-[#222222]"
        >
          {routing.locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => choose(l)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#F3F9FB] cursor-pointer"
              >
                <span lang={l}>{LOCALE_LABELS[l]}</span>
                {l === locale && <Check className="w-3.5 h-3.5 text-[#008ECC]" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
