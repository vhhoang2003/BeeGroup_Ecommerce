/**
 * Temporary object storage: serves images from the `product/` folder by storage key
 * (e.g. `/storage/CPU/Epyc%207402/images/01-top.jpg`). Replaced by S3/R2 + CDN in production.
 */
import { promises as fs } from 'fs';
import path from 'path';
import type { NextRequest } from 'next/server';
import { CATALOG_DIR } from '@/lib/catalog/source';

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export async function GET(_request: NextRequest, ctx: RouteContext<'/storage/[...key]'>) {
  const { key } = await ctx.params;
  const file = path.resolve(CATALOG_DIR, ...key.map((part) => decodeURIComponent(part)));
  const contentType = CONTENT_TYPES[path.extname(file).toLowerCase()];

  // Only image files inside the catalog folder are exposed.
  if (!contentType || !file.startsWith(CATALOG_DIR + path.sep)) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const body = await fs.readFile(file);
    return new Response(body, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
