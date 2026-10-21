/**
 * Server-side catalog reads for SSR / ISR pages, metadata and the sitemap (CAT-12, README §6.5).
 *
 * Calls the API over the Docker network (`INTERNAL_API_URL`) with a 5-minute revalidation window; admin edits
 * refresh pages earlier through `/api/revalidate`. In mock mode it reads the `product/` folder directly, since a
 * server component cannot call the app's own relative `/mock-api` routes.
 */
import 'server-only';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Category } from '@/types/category';
import type { Locale, ProductDetail, ProductSummary } from '@/types/product';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';
const BASE_URL =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const REVALIDATE_SECONDS = 300;
/** A hung API must not hang page rendering: the page falls back to `error.tsx` instead. */
const TIMEOUT_MS = 10_000;

async function get<T>(path: string): Promise<T | null> {
  const response = await fetch(`${BASE_URL}${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`);
  return ((await response.json()) as ApiResponse<T>).data;
}

const seg = encodeURIComponent;

async function mock() {
  return import('@/lib/catalog/source');
}

export async function fetchProduct(slug: string, locale: Locale): Promise<ProductDetail | null> {
  if (USE_MOCK) return (await mock()).getProduct(slug, locale);
  return get<ProductDetail>(`/products/${seg(slug)}?locale=${locale}`);
}

export async function fetchRelated(slug: string, locale: Locale): Promise<ProductSummary[]> {
  if (USE_MOCK) return (await mock()).listRelated(slug, locale);
  return (await get<ProductSummary[]>(`/products/${seg(slug)}/related?locale=${locale}&limit=4`)) ?? [];
}

export async function fetchCategory(slug: string, locale: Locale): Promise<Category | null> {
  if (USE_MOCK) return (await mock()).getCategory(slug);
  return get<Category>(`/categories/${seg(slug)}?locale=${locale}`);
}

export async function fetchCategories(locale: Locale): Promise<Category[]> {
  if (USE_MOCK) return (await mock()).listCategories();
  return (await get<Category[]>(`/categories?locale=${locale}`)) ?? [];
}

/** Every published product slug, for the sitemap (paged at the API maximum of 48). */
export async function fetchAllProductSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  for (let page = 0; page < 50; page++) {
    const result = USE_MOCK
      ? await (await mock()).listProducts({ page, size: 48 }, 'vi')
      : await get<PaginatedResponse<ProductSummary>>(`/products?page=${page}&size=48`);
    if (!result) break;
    slugs.push(...result.content.map((p) => p.slug));
    if (result.last) break;
  }
  return slugs;
}
