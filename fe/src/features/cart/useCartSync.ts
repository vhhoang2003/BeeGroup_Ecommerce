'use client';

import { useEffect, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useAppLocale } from '@/features/catalog/hooks';
import { CatalogApi } from '@/lib/api/endpoints';
import { useCartStore, useHydrated } from './store';

/**
 * The cart keeps a snapshot of each product from when it was added. On the cart and checkout pages this re-reads
 * every product so prices set later in the admin (or a product taken off sale) show up before the customer sends
 * a quote request. Network errors leave the snapshot as it is.
 */
export function useCartSync() {
  const locale = useAppLocale();
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const refresh = useCartStore((s) => s.refresh);
  const slugs = useMemo(
    () => (hydrated ? [...new Set(items.map((i) => i.slug))].sort() : []),
    [hydrated, items]
  );

  const results = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: ['cart-line', slug, locale],
      queryFn: () => CatalogApi.getProduct(slug, locale),
      staleTime: 60_000,
      retry: 1,
    })),
  });

  // One string per fetch outcome, so the effect runs when data arrives, not on every render.
  const version = results.map((r) => `${r.status}:${r.dataUpdatedAt}`).join('|');
  useEffect(() => {
    results.forEach((r, i) => {
      if (r.isSuccess) refresh(slugs[i], r.data);
    });
    // `results` and `slugs` are described by `version`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, refresh]);
}
