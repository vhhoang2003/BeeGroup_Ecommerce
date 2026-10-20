'use client';

import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { CatalogApi } from '@/lib/api/endpoints';
import type { Locale } from '@/types/product';

export function useAppLocale(): Locale {
  return useLocale() as Locale;
}

/** Category list shared by the nav, footer, tiles and filters (one cached query per locale). */
export function useCategories() {
  const locale = useAppLocale();
  return useQuery({
    queryKey: ['categories', locale],
    queryFn: () => CatalogApi.getCategories(locale),
  });
}
