/**
 * On-demand revalidation called by the API after admin edits (README §6.7, BE `RevalidationNotifier`):
 * `POST {"secret": REVALIDATE_SECRET, "paths": ["/", "/products/amd-epyc-7402", ...]}`. Paths come without a locale
 * prefix, so each one is revalidated for every locale.
 */
import { timingSafeEqual } from 'crypto';
import { revalidatePath } from 'next/cache';
import { routing } from '@/i18n/routing';
import { localizedPath } from '@/lib/seo';

function secretMatches(given: unknown): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || typeof given !== 'string') return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { secret?: unknown; paths?: unknown } | null;
  if (!secretMatches(body?.secret)) {
    return Response.json({ revalidated: false }, { status: 401 });
  }
  const paths = Array.isArray(body?.paths)
    ? body.paths.filter((p): p is string => typeof p === 'string' && p.startsWith('/')).slice(0, 50)
    : [];
  for (const path of paths) {
    for (const locale of routing.locales) revalidatePath(localizedPath(locale, path));
  }
  return Response.json({ revalidated: true, paths });
}
