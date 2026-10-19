import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { Product } from '@/types/product';

const mockProduct: Product = {
  id: 'phone-99',
  name: 'Mega Phone',
  slug: 'mega-phone',
  brand: 'MegaBrand',
  category: 'Smartphones',
  categorySlug: 'smartphones',
  price: 10000,
  originalPrice: 20000,
  discountPercentage: 50,
  savings: 10000,
  rating: 4.5,
  reviewCount: 50,
  inStock: true,
  stockCount: 10,
  image: '/images/products/galaxy_m13.png',
  description: 'Test phone',
};

describe('Cart Store (Zustand)', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('adds product and calculates total price and savings correctly', () => {
    const store = useCartStore.getState();
    store.addItem(mockProduct, 2);

    expect(useCartStore.getState().getTotalItems()).toBe(2);
    expect(useCartStore.getState().getTotalPrice()).toBe(20000);
    expect(useCartStore.getState().getTotalSavings()).toBe(20000);
  });

  it('updates quantity and removes item when quantity reaches zero', () => {
    const store = useCartStore.getState();
    store.addItem(mockProduct, 1);
    const itemId = useCartStore.getState().items[0].id;

    store.updateQuantity(itemId, 3);
    expect(useCartStore.getState().getTotalItems()).toBe(3);

    store.updateQuantity(itemId, 0);
    expect(useCartStore.getState().getTotalItems()).toBe(0);
  });
});
