import type { NextRequest } from 'next/server';
import { ok } from '@/lib/catalog/envelope';
import { parseLocale, suggest } from '@/lib/catalog/source';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  return ok(await suggest(query.get('q') ?? '', parseLocale(query.get('locale'))));
}
