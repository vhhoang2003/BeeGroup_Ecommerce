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
      soldCount: 3,
      subtotal: 6760000,
      hasUnpriced: true,
      hasUnavailable: false,
    });
  });

  it('persists the cart in localStorage', () => {
    useCartStore.getState().add(product('1', 10), 4);
    const saved = JSON.parse(localStorage.getItem('beestore-cart') ?? '{}');
    expect(saved.state.items[0]).toMatchObject({ productId: '1', quantity: 4, price: 10 });
  });
});

describe('cart refresh', () => {
  it('updates a line to the current catalog price and name', () => {
    useCartStore.getState().add(product('1', null), 2);
    useCartStore.getState().refresh('p-1', { ...product('1', 3200000), name: 'JetKVM' });
    const [line] = useCartStore.getState().items;
    expect(line).toMatchObject({ price: 3200000, name: 'JetKVM', quantity: 2, unavailable: false });
    expect(cartTotals(useCartStore.getState().items).subtotal).toBe(6400000);
  });

  it('marks a product that is gone and leaves it out of the totals', () => {
    useCartStore.getState().add(product('1', 1000), 1);
    useCartStore.getState().add(product('2', null), 1);
    useCartStore.getState().refresh('p-2', null);
    const totals = cartTotals(useCartStore.getState().items);
    expect(useCartStore.getState().items[1].unavailable).toBe(true);
    expect(totals).toMatchObject({ subtotal: 1000, hasUnpriced: false, hasUnavailable: true, count: 2 });
  });

  it('keeps the same state object when nothing changed', () => {
    useCartStore.getState().add(product('1', 1000), 1);
    useCartStore.getState().refresh('p-1', product('1', 1000));
    const before = useCartStore.getState().items;
    useCartStore.getState().refresh('p-1', product('1', 1000));
    expect(useCartStore.getState().items).toBe(before);
  });
});
