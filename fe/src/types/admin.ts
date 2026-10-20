/** Bodies of `/api/v1/admin/**` (BE `AdminDtos`). Localized maps are keyed vi / en / zh. */
import type { Locale, StockStatus } from './product';
import type { InquiryStatus, InquiryType, ProductSnapshot } from './inquiry';
import type { ContactChannel, Role, UserStatus } from './user';

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export const PRODUCT_STATUSES: ProductStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

export type LocalizedText = Partial<Record<Locale, string>>;

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
  label: LocalizedText;
  value: LocalizedText;
}

export interface ProductRequest {
  slug: string;
  sku?: string | null;
  brand: string;
  categorySlug: string;
  subCategorySlug?: string | null;
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
  thumbnailUrl: string | null;
  alt: LocalizedText;
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

export interface ImageUpdateRequest {
  sortOrder?: number;
  primary?: boolean;
  alt?: LocalizedText;
  credit?: string;
}

export interface CategoryRequest {
  slug: string;
  name: LocalizedText;
  imageUrl?: string | null;
  sortOrder: number;
}

export interface SubCategoryRequest {
  slug: string;
  name: LocalizedText;
  sortOrder: number;
}

export interface AdminSubCategory {
  id: string;
  slug: string;
  name: LocalizedText;
  sortOrder: number;
  productCount: number;
}

export interface AdminCategory {
  id: string;
  slug: string;
  name: LocalizedText;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
  subCategories: AdminSubCategory[];
}

export interface InquiryUpdateRequest {
  status?: InquiryStatus;
  assigneeId?: string;
  unassign?: boolean;
  note?: string;
}

export interface InquiryEvent {
  fromStatus: InquiryStatus | null;
  toStatus: InquiryStatus | null;
  note: string | null;
  actorId: string | null;
  actorName: string | null;
  at: string;
}

export interface AdminInquiry {
  id: string;
  code: string;
  type: InquiryType;
  status: InquiryStatus;
  productId: string | null;
  product: ProductSnapshot | null;
  quantity: number;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  preferredContact: ContactChannel | null;
  subject: string | null;
  message: string | null;
  locale: string | null;
  userId: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
  events: InquiryEvent[];
}

export interface AdminInquiryFilter {
  status?: InquiryStatus;
  from?: string;
  to?: string;
  productId?: string;
  assignee?: string;
  q?: string;
  page?: number;
  size?: number;
}

export interface UserUpdateRequest {
  status?: Extract<UserStatus, 'ACTIVE' | 'LOCKED'>;
  role?: Role;
  resendVerification?: boolean;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  ipAddress: string | null;
  createdAt: string;
}

export interface ImportReport {
  categoriesCreated: number;
  categoriesUpdated: number;
  productsCreated: number;
  productsUpdated: number;
  productsSkipped: number;
  errors: string[];
}
