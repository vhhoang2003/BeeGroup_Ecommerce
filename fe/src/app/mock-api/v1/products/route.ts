import type { NextRequest } from 'next/server';
import { ok } from '@/lib/catalog/envelope';
import { listProducts, parseLocale } from '@/lib/catalog/source';
import type { ProductSort, StockStatus } from '@/types/product';

function toNumber(value: string | null): number | undefined {
  if (value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  return ok(
    await listProducts(
      {
        category: query.get('category') || undefined,
        sub: query.get('sub') || undefined,
        brand: query.get('brand') || undefined,
        stock: (query.get('stock') as StockStatus) || undefined,
        minPrice: toNumber(query.get('minPrice')),
        maxPrice: toNumber(query.get('maxPrice')),
        q: query.get('q') || undefined,
        sort: (query.get('sort') as ProductSort) || undefined,
        page: toNumber(query.get('page')),
        size: toNumber(query.get('size')),
      },
      parseLocale(query.get('locale'))
    )
  );
}
