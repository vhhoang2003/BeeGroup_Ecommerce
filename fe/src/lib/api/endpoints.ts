import { ApiError, apiClient } from './client';
import type { ProductDetail, ProductFilterParams, ProductSummary } from '@/types/product';
import type { Category } from '@/types/category';
import type { PaginatedResponse } from '@/types/api';

export function toQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const s = query.toString();
  return s ? `?${s}` : '';
}

/** Returns null instead of throwing when the resource does not exist. */
async function orNull<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export const CatalogApi = {
  getCategories(): Promise<Category[]> {
    return apiClient<Category[]>('/categories');
  },

  getCategory(slug: string): Promise<Category | null> {
    return orNull(apiClient<Category>(`/categories/${encodeURIComponent(slug)}`));
  },

  getProducts(params: ProductFilterParams = {}): Promise<PaginatedResponse<ProductSummary>> {
    return apiClient<PaginatedResponse<ProductSummary>>(`/products${toQuery({ ...params })}`);
  },

  getFeaturedProducts(): Promise<ProductSummary[]> {
    return apiClient<ProductSummary[]>('/products/featured');
  },

  getProduct(slug: string): Promise<ProductDetail | null> {
    return orNull(apiClient<ProductDetail>(`/products/${encodeURIComponent(slug)}`));
  },

  getRelatedProducts(slug: string): Promise<ProductSummary[]> {
    return apiClient<ProductSummary[]>(`/products/${encodeURIComponent(slug)}/related?limit=4`);
  },

  searchSuggestions(q: string): Promise<ProductSummary[]> {
    return apiClient<ProductSummary[]>(`/products/suggestions${toQuery({ q })}`);
  },
};
