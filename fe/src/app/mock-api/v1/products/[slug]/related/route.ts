import type { NextRequest } from 'next/server';
import { ok } from '@/lib/catalog/envelope';
import { listRelated, parseLocale } from '@/lib/catalog/source';

export async function GET(request: NextRequest, ctx: RouteContext<'/mock-api/v1/products/[slug]/related'>) {
  const { slug } = await ctx.params;
  const query = request.nextUrl.searchParams;
  const limit = Math.min(Number(query.get('limit')) || 4, 12);
  return ok(await listRelated(slug, parseLocale(query.get('locale')), limit));
}
