'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types/product';
import { CartItem, CartState } from '@/types/cart';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [
        // Preload with 1 item for instant preview of badge & cart
        {
          id: 'phone-2',
          product: {
            id: 'phone-2',
            name: 'Galaxy M13 (4GB | 64 GB )',
            slug: 'galaxy-m13-4gb-64gb',
            brand: 'Samsung',
            category: 'Smartphones',
            categorySlug: 'smartphones',
            price: 10499,
            originalPrice: 14999,
            discountPercentage: 56,
            savings: 4500,
            rating: 4.5,
            reviewCount: 3820,
            inStock: true,
            stockCount: 40,
            image: '/images/products/galaxy_m13.png',
            description: 'Samsung Galaxy M13 with massive 6000mAh battery',
            isFeatured: true,
          },
          quantity: 1,
        },
      ],
      isOpen: false,

      addItem: (product: Product, quantity = 1, options = {}) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.product.id === product.id
          );
          if (existingIndex > -1) {
            const updated = [...state.items];
            updated[existingIndex].quantity += quantity;
            return { items: updated, isOpen: true };
          }
          const newItem: CartItem = {
            id: `${product.id}-${Date.now()}`,
            product,
            quantity,
            selectedColor: options.color,
            selectedStorage: options.storage,
          };
          return { items: [...state.items, newItem], isOpen: true };
        });
      },

      removeItem: (itemId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId && item.product.id !== itemId),
        }));
      },

      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId || item.product.id === itemId
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },

      getTotalSavings: () => {
        return get().items.reduce(
          (total, item) => total + item.product.savings * item.quantity,
          0
        );
      },
    }),
    {
      name: 'megamart_cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
