'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { siteConfig } from '@/config/site';

/**
 * Fallback for unexpected errors in a page (most often the API being unreachable): a localized message, a retry
 * that re-renders the segment, and the hotline so a customer can still reach sales.
 */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations('errorPage');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-[520px] mx-auto px-4 py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-honey-100 text-honey-800 flex items-center justify-center mx-auto mb-5">
        <TriangleAlert className="w-7 h-7" aria-hidden />
      </div>
      <h1 className="text-2xl font-extrabold text-ink mb-2">{t('title')}</h1>
      <p className="text-sm text-slate-600 mb-6">
        {t.rich('body', {
          phone: () => (
            <a href={siteConfig.contact.hotlineHref} className="font-semibold text-ink underline whitespace-nowrap">
              {siteConfig.contact.hotline}
            </a>
          ),
        })}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-white px-6 py-2.5 rounded-full font-semibold text-sm cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" aria-hidden />
          {t('retry')}
        </button>
        <Link
          href="/"
          className="inline-flex items-center bg-white border border-line hover:border-honey-500 text-ink px-6 py-2.5 rounded-full font-semibold text-sm"
        >
          {t('home')}
        </Link>
      </div>
    </div>
  );
}
