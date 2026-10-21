import { describe, expect, it } from 'vitest';
import { depositSplit } from '@/features/cart/components/DepositNote';

describe('depositSplit', () => {
  it('takes half of the order as deposit', () => {
    expect(depositSplit(6760000)).toEqual({ deposit: 3380000, rest: 3380000 });
  });

  it('rounds the deposit up to the đồng and keeps the sum', () => {
    expect(depositSplit(11710401)).toEqual({ deposit: 5855201, rest: 5855200 });
  });

  it('is zero for an empty or unpriced cart', () => {
    expect(depositSplit(0)).toEqual({ deposit: 0, rest: 0 });
  });
});
