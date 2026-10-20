import { defineRouting } from 'next-intl/routing';
import type { Locale } from '@/types/product';

/** vi (default), en, zh, always in the URL prefix (`/vi/products`) and remembered in a cookie (README §10 i18n). */
export const routing = defineRouting({
  locales: ['vi', 'en', 'zh'] satisfies Locale[],
  defaultLocale: 'vi',
  localePrefix: 'always',
});

export const LOCALE_LABELS: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
};

/** BCP 47 tags for `Intl` formatting and `<html lang>`. */
export const LOCALE_TAGS: Record<Locale, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  zh: 'zh-CN',
};
