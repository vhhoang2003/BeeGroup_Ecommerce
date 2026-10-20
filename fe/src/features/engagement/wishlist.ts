'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useAppLocale } from '@/features/catalog/hooks';
import { MeApi } from '@/lib/api/endpoints';
import type { ProductSummary } from '@/types/product';

/** The logged-in user's saved products (ENG-06); empty and idle for guests. */
export function useWishlist() {
  const locale = useAppLocale();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['wishlist', locale],
    queryFn: () => MeApi.wishlist(locale),
    enabled: isAuthenticated,
  });
}

/** Adds or removes one product, updating every cached wishlist optimistically. */
export function useToggleWishlist() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ product, saved }: { product: ProductSummary; saved: boolean }) =>
      saved ? MeApi.removeFromWishlist(product.id) : MeApi.addToWishlist(product.id),
    onMutate: async ({ product, saved }) => {
      await client.cancelQueries({ queryKey: ['wishlist'] });
      const previous = client.getQueriesData<ProductSummary[]>({ queryKey: ['wishlist'] });
      client.setQueriesData<ProductSummary[]>({ queryKey: ['wishlist'] }, (list = []) =>
        saved ? list.filter((p) => p.id !== product.id) : [...list, product]
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => client.setQueryData(key, data));
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['wishlist'] }),
  });
}
