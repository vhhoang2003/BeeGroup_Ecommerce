import { beforeEach, describe, expect, it } from 'vitest';
import { cartTotals, MAX_QUANTITY, useCartStore } from '@/features/cart/store';
import type { ProductSummary } from '@/types/product';

const product = (id: string, price: number | null): ProductSummary => ({
  id,
  slug: `p-${id}`,
  name: `Product ${id}`,
  brand: 'AMD',
  category: { slug: 'cpu', name: 'CPU' },
  subCategory: null,
  price,
  stockStatus: 'IN_STOCK',
  featured: false,
  shortDescription: '',
  image: null,
});

beforeEach(() => {
  useCartStore.setState({ items: [] });
  localStorage.clear();
});

describe('cart store', () => {
  it('adds products and merges repeated adds into one line', () => {
    const { add } = useCartStore.getState();
    add(product('1', 3380000), 2);
    add(product('1', 3380000));
    add(product('2', 1000000));

    const { items } = useCartStore.getState();
    expect(items.map((i) => [i.productId, i.quantity])).toEqual([
      ['1', 3],
      ['2', 1],
    ]);
  });

  it('keeps quantities between 1 and the maximum', () => {
    const { add, setQuantity } = useCartStore.getState();
    add(product('1', 10), 500);
    expect(useCartStore.getState().items[0].quantity).toBe(MAX_QUANTITY);
    setQuantity('1', 0);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
    setQuantity('1', Number.NaN);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it('removes lines and clears', () => {
    const { add, remove, clear } = useCartStore.getState();
    add(product('1', 10));
    add(product('2', 10));
    remove('1');
    expect(useCartStore.getState().items.map((i) => i.productId)).toEqual(['2']);
    clear();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('totals priced lines only and flags "contact for price" ones', () => {
    const { add } = useCartStore.getState();
    add(product('1', 3380000), 2);
    add(product('2', null), 1);

    expect(cartTotals(useCartStore.getState().items)).toEqual({
      count: 3,
      subtotal: 6760000,
      hasUnpriced: true,
    });
  });

  it('persists the cart in localStorage', () => {
    useCartStore.getState().add(product('1', 10), 4);
    const saved = JSON.parse(localStorage.getItem('beestore-cart') ?? '{}');
    expect(saved.state.items[0]).toMatchObject({ productId: '1', quantity: 4, price: 10 });
  });
});
