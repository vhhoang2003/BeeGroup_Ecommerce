'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, ChevronDown } from 'lucide-react';
import Flag from '@/components/ui/Flag';
import { usePathname, useRouter } from '@/i18n/navigation';
import { LOCALE_LABELS, routing } from '@/i18n/routing';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { MeApi } from '@/lib/api/endpoints';
import type { Locale } from '@/types/product';
import { cn } from '@/lib/utils';

/** Switches the URL locale prefix (kept in the NEXT_LOCALE cookie) and the profile's preferred language. */
export default function LanguageSwitcher({
  className,
  tone = 'dark',
}: {
  className?: string;
  tone?: 'dark' | 'light';
}) {
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
        className={cn(
          'flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-medium transition-colors cursor-pointer min-h-[36px]',
          tone === 'dark'
            ? 'border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-honey/60'
            : 'border border-slate-200 bg-white text-ink hover:border-honey-500 hover:text-honey-700'
        )}
      >
        <Flag locale={locale} />
        <span>{LOCALE_LABELS[locale]}</span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 transition-transform',
            tone === 'dark' ? 'text-slate-300' : 'text-slate-400',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t('language')}
          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-line py-1.5 z-50 text-[14px] text-ink"
        >
          {routing.locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => choose(l)}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-paper cursor-pointer transition-colors',
                  l === locale && 'font-bold text-honey-700 bg-honey-50/50'
                )}
              >
                <Flag locale={l} />
                <span lang={l} className="flex-1 text-left">
                  {LOCALE_LABELS[l]}
                </span>
                {l === locale && <Check className="w-4 h-4 text-honey-700" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
