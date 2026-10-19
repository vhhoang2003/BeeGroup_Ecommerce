/** Admin DTOs of `/api/v1/admin/**` (ADM-02..04). Localized maps are keyed vi / en / zh. */
import type { Locale, StockStatus } from './product';

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type LocalizedMap = Partial<Record<Locale, string>>;

export interface TranslationInput {
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  highlights?: string[] | null;
  useCases?: string[] | null;
  notes?: string[] | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface SpecInput {
  key: string;
  label: LocalizedMap;
  value: LocalizedMap;
}

export interface ProductRequest {
  slug: string;
  sku: string | null;
  brand: string;
  categorySlug: string;
  subCategorySlug: string | null;
  price: number | null;
  stockStatus: StockStatus;
  status: ProductStatus;
  featured: boolean;
  translations: Partial<Record<Locale, TranslationInput>>;
  specs: SpecInput[];
  sources: string[];
}

export interface AdminImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt: LocalizedMap;
  credit: string | null;
  sortOrder: number;
  width: number | null;
  height: number | null;
}

export interface AdminProduct extends ProductRequest {
  id: string;
  images: AdminImage[];
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductListItem {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  price: number | null;
  stockStatus: StockStatus;
  status: ProductStatus;
  featured: boolean;
  viewCount: number;
  updatedAt: string;
}

export interface AdminSubCategory {
  id: string;
  slug: string;
  name: LocalizedMap;
  sortOrder: number;
  productCount: number;
}

export interface AdminCategory {
  id: string;
  slug: string;
  name: LocalizedMap;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
  subCategories: AdminSubCategory[];
}

export interface AdminProductListParams {
  q?: string;
  status?: ProductStatus;
  category?: string;
  page?: number;
  size?: number;
}
