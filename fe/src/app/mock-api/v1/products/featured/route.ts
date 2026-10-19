import type { NextRequest } from 'next/server';
import { ok } from '@/lib/catalog/envelope';
import { listFeatured, parseLocale } from '@/lib/catalog/source';

export async function GET(request: NextRequest) {
  return ok(await listFeatured(parseLocale(request.nextUrl.searchParams.get('locale'))));
}
