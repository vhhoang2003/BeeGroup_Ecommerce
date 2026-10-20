'use client';

import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { ProductSummary } from '@/types/product';

export const MAX_QUANTITY = 99;

/** What the cart keeps of a product: a snapshot taken when it was added. */
export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  /** VND; null means "contact for price" and is left out of the subtotal. */
  price: number | null;
  image: ProductSummary['image'];
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (product: ProductSummary, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const clamp = (n: number) => Math.min(Math.max(Math.round(n) || 1, 1), MAX_QUANTITY);

/** localStorage can be missing or throw (private mode, blocked site data); the cart then lives for the page only. */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // ignore
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

/**
 * Shopping cart, kept in the browser only (no server cart in v1). Online payment is not available yet, so the
 * checkout page shows the order but its pay button stays disabled.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id ? { ...i, quantity: clamp(i.quantity + quantity) } : i
              ),
            };
          }
          const item: CartItem = {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            categorySlug: product.category.slug,
            price: product.price,
            image: product.image,
            quantity: clamp(quantity),
          };
          return { items: [...state.items, item] };
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) => (i.productId === productId ? { ...i, quantity: clamp(quantity) } : i)),
        })),
      remove: (productId) => set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'beestore-cart', version: 1, storage: createJSONStorage(() => safeStorage) }
  )
);

export interface CartTotals {
  /** Number of units, for the header badge. */
  count: number;
  /** Sum of the priced lines, in VND. */
  subtotal: number;
  /** True when some lines have no published price. */
  hasUnpriced: boolean;
}

export function cartTotals(items: CartItem[]): CartTotals {
  return {
    count: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: items.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0),
    hasUnpriced: items.some((i) => i.price === null),
  };
}

/**
 * The persisted cart is only known in the browser; render cart-dependent UI after mount so the server HTML and the
 * first client render match.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

const noopSubscribe = () => () => {};
