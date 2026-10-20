import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import type { Locale } from '@/types/product';

/** `/products/x` -> `/vi/products/x`; the home page is `/vi`. */
export function localizedPath(locale: Locale, path: string): string {
  return `/${locale}${path === '/' ? '' : path}`;
}

/** Canonical URL plus one `hreflang` alternate per locale (CAT-12). */
export function alternates(locale: Locale, path: string): Metadata['alternates'] {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = localizedPath(l, path);
  languages['x-default'] = localizedPath(routing.defaultLocale, path);
  return { canonical: localizedPath(locale, path), languages };
}

export const OG_LOCALES: Record<Locale, string> = { vi: 'vi_VN', en: 'en_US', zh: 'zh_CN' };
