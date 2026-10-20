'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

/** "Search results for …" or "All products", depending on `?q=`. */
export default function ProductsTitle() {
  const t = useTranslations('catalog');
  const q = useSearchParams().get('q');
  return <>{q ? t('searchResults', { q }) : t('allProducts')}</>;
}
