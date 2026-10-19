import type { NextRequest } from 'next/server';
import { notFound, ok } from '@/lib/catalog/envelope';
import { getCategory } from '@/lib/catalog/source';

export async function GET(_request: NextRequest, ctx: RouteContext<'/mock-api/v1/categories/[slug]'>) {
  const { slug } = await ctx.params;
  const category = await getCategory(slug);
  return category ? ok(category) : notFound(`Category '${slug}' not found`);
}
