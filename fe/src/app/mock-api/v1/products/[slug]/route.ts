import type { NextRequest } from 'next/server';
import { notFound, ok } from '@/lib/catalog/envelope';
import { getProduct, parseLocale } from '@/lib/catalog/source';

export async function GET(request: NextRequest, ctx: RouteContext<'/mock-api/v1/products/[slug]'>) {
  const { slug } = await ctx.params;
  const product = await getProduct(slug, parseLocale(request.nextUrl.searchParams.get('locale')));
  return product ? ok(product) : notFound(`Product '${slug}' not found`);
}
