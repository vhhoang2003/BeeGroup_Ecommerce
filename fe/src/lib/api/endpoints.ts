import { ApiError, apiBlob, apiClient, json } from './client';
import type { Locale, ProductDetail, ProductFilterParams, ProductSummary } from '@/types/product';
import type { Category } from '@/types/category';
import type { PaginatedResponse } from '@/types/api';
import type { LoginResponse, RegisterRequest, UpdateProfileRequest, User } from '@/types/user';
import type { ContactRequest, InquiryCreated, MyInquiry, ProductInquiryRequest } from '@/types/inquiry';
import type {
  AdminCategory,
  AdminImage,
  AdminInquiry,
  AdminInquiryFilter,
  AdminProduct,
  AdminProductListItem,
  AuditLog,
  CategoryRequest,
  ImageUpdateRequest,
  ImportReport,
  InquiryUpdateRequest,
  ProductRequest,
  ProductStatus,
  SheetImportReport,
  SubCategoryRequest,
  UserUpdateRequest,
} from '@/types/admin';
import type { Role, UserStatus } from '@/types/user';

export function toQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
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

const seg = encodeURIComponent;

export const CatalogApi = {
  getCategories(locale: Locale): Promise<Category[]> {
    return apiClient<Category[]>(`/categories${toQuery({ locale })}`);
  },

  getCategory(slug: string, locale: Locale): Promise<Category | null> {
    return orNull(apiClient<Category>(`/categories/${seg(slug)}${toQuery({ locale })}`));
  },

  getProducts(params: ProductFilterParams, locale: Locale): Promise<PaginatedResponse<ProductSummary>> {
    return apiClient<PaginatedResponse<ProductSummary>>(`/products${toQuery({ ...params, locale })}`);
  },

  getFeaturedProducts(locale: Locale): Promise<ProductSummary[]> {
    return apiClient<ProductSummary[]>(`/products/featured${toQuery({ locale })}`);
  },

  getProduct(slug: string, locale: Locale): Promise<ProductDetail | null> {
    return orNull(apiClient<ProductDetail>(`/products/${seg(slug)}${toQuery({ locale })}`));
  },

  getRelatedProducts(slug: string, locale: Locale): Promise<ProductSummary[]> {
    return apiClient<ProductSummary[]>(`/products/${seg(slug)}/related${toQuery({ locale, limit: 4 })}`);
  },

  searchSuggestions(q: string, locale: Locale): Promise<ProductSummary[]> {
    return apiClient<ProductSummary[]>(`/products/suggestions${toQuery({ q, locale })}`);
  },

  /** Fire-and-forget view counter (README §6.5). */
  recordView(productId: string): Promise<void> {
    return apiClient<void>(`/products/${seg(productId)}/views`, { method: 'POST' });
  },
};

export const AuthApi = {
  register(body: RegisterRequest): Promise<void> {
    return apiClient<void>('/auth/register', json('POST', body));
  },
  verifyEmail(token: string): Promise<void> {
    return apiClient<void>('/auth/verify-email', json('POST', { token }));
  },
  resendVerification(email: string): Promise<void> {
    return apiClient<void>('/auth/resend-verification', json('POST', { email }));
  },
  login(email: string, password: string, rememberMe: boolean): Promise<LoginResponse> {
    return apiClient<LoginResponse>('/auth/login', json('POST', { email, password, rememberMe }));
  },
  logout(): Promise<void> {
    return apiClient<void>('/auth/logout', { method: 'POST' });
  },
  forgotPassword(email: string): Promise<void> {
    return apiClient<void>('/auth/forgot-password', json('POST', { email }));
  },
  resetPassword(token: string, newPassword: string): Promise<void> {
    return apiClient<void>('/auth/reset-password', json('POST', { token, newPassword }));
  },
};

export const MeApi = {
  get(): Promise<User> {
    return apiClient<User>('/me');
  },
  update(body: UpdateProfileRequest): Promise<User> {
    return apiClient<User>('/me', json('PATCH', body));
  },
  changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return apiClient<void>('/me/change-password', json('POST', { currentPassword, newPassword }));
  },
  changeEmail(newEmail: string, password: string): Promise<void> {
    return apiClient<void>('/me/change-email', json('POST', { newEmail, password }));
  },
  deleteAccount(password: string): Promise<void> {
    return apiClient<void>('/me', json('DELETE', { password }));
  },
  /** `/auth/logout-all` is Bearer-authenticated, unlike `/auth/logout`. */
  logoutAll(): Promise<void> {
    return apiClient<void>('/auth/logout-all', { method: 'POST' });
  },
  inquiries(page = 0, size = 12): Promise<PaginatedResponse<MyInquiry>> {
    return apiClient<PaginatedResponse<MyInquiry>>(`/me/inquiries${toQuery({ page, size })}`);
  },
  wishlist(locale: Locale): Promise<ProductSummary[]> {
    return apiClient<ProductSummary[]>(`/me/wishlist${toQuery({ locale })}`);
  },
  addToWishlist(productId: string): Promise<void> {
    return apiClient<void>(`/me/wishlist/${seg(productId)}`, { method: 'POST' });
  },
  removeFromWishlist(productId: string): Promise<void> {
    return apiClient<void>(`/me/wishlist/${seg(productId)}`, { method: 'DELETE' });
  },
};

export const InquiryApi = {
  create(body: ProductInquiryRequest): Promise<InquiryCreated> {
    return apiClient<InquiryCreated>('/inquiries', json('POST', body));
  },
  contact(body: ContactRequest): Promise<InquiryCreated> {
    return apiClient<InquiryCreated>('/contact', json('POST', body));
  },
};

export const AdminApi = {
  products(params: { q?: string; status?: ProductStatus; category?: string; page?: number; size?: number }) {
    return apiClient<PaginatedResponse<AdminProductListItem>>(`/admin/products${toQuery(params)}`);
  },
  product(id: string): Promise<AdminProduct> {
    return apiClient<AdminProduct>(`/admin/products/${seg(id)}`);
  },
  createProduct(body: ProductRequest): Promise<AdminProduct> {
    return apiClient<AdminProduct>('/admin/products', json('POST', body));
  },
  updateProduct(id: string, body: ProductRequest): Promise<AdminProduct> {
    return apiClient<AdminProduct>(`/admin/products/${seg(id)}`, json('PUT', body));
  },
  deleteProduct(id: string): Promise<void> {
    return apiClient<void>(`/admin/products/${seg(id)}`, { method: 'DELETE' });
  },
  setProductStatus(id: string, status: ProductStatus): Promise<AdminProduct> {
    return apiClient<AdminProduct>(`/admin/products/${seg(id)}/status`, json('PATCH', { status }));
  },
  uploadImage(
    id: string,
    file: File,
    meta: { altVi?: string; altEn?: string; altZh?: string; credit?: string }
  ): Promise<AdminImage> {
    const form = new FormData();
    form.append('file', file);
    for (const [key, value] of Object.entries(meta)) if (value) form.append(key, value);
    return apiClient<AdminImage>(`/admin/products/${seg(id)}/images`, { method: 'POST', body: form });
  },
  updateImage(id: string, imageId: string, body: ImageUpdateRequest): Promise<AdminProduct> {
    return apiClient<AdminProduct>(`/admin/products/${seg(id)}/images/${seg(imageId)}`, json('PATCH', body));
  },
  deleteImage(id: string, imageId: string): Promise<void> {
    return apiClient<void>(`/admin/products/${seg(id)}/images/${seg(imageId)}`, { method: 'DELETE' });
  },

  categories(): Promise<AdminCategory[]> {
    return apiClient<AdminCategory[]>('/admin/categories');
  },
  createCategory(body: CategoryRequest): Promise<AdminCategory> {
    return apiClient<AdminCategory>('/admin/categories', json('POST', body));
  },
  updateCategory(id: string, body: CategoryRequest): Promise<AdminCategory> {
    return apiClient<AdminCategory>(`/admin/categories/${seg(id)}`, json('PUT', body));
  },
  deleteCategory(id: string): Promise<void> {
    return apiClient<void>(`/admin/categories/${seg(id)}`, { method: 'DELETE' });
  },
  addSubCategory(id: string, body: SubCategoryRequest): Promise<AdminCategory> {
    return apiClient<AdminCategory>(`/admin/categories/${seg(id)}/sub-categories`, json('POST', body));
  },
  updateSubCategory(id: string, subId: string, body: SubCategoryRequest): Promise<AdminCategory> {
    return apiClient<AdminCategory>(`/admin/categories/${seg(id)}/sub-categories/${seg(subId)}`, json('PUT', body));
  },
  deleteSubCategory(id: string, subId: string): Promise<AdminCategory> {
    return apiClient<AdminCategory>(`/admin/categories/${seg(id)}/sub-categories/${seg(subId)}`, {
      method: 'DELETE',
    });
  },

  inquiries(filter: AdminInquiryFilter): Promise<PaginatedResponse<AdminInquiry>> {
    return apiClient<PaginatedResponse<AdminInquiry>>(`/admin/inquiries${toQuery({ ...filter })}`);
  },
  inquiry(id: string): Promise<AdminInquiry> {
    return apiClient<AdminInquiry>(`/admin/inquiries/${seg(id)}`);
  },
  updateInquiry(id: string, body: InquiryUpdateRequest): Promise<AdminInquiry> {
    return apiClient<AdminInquiry>(`/admin/inquiries/${seg(id)}`, json('PATCH', body));
  },

  users(params: { q?: string; role?: Role; status?: UserStatus; page?: number; size?: number }) {
    return apiClient<PaginatedResponse<User>>(`/admin/users${toQuery(params)}`);
  },
  updateUser(id: string, body: UserUpdateRequest): Promise<User> {
    return apiClient<User>(`/admin/users/${seg(id)}`, json('PATCH', body));
  },

  auditLogs(params: { entityType?: string; entityId?: string; page?: number; size?: number }) {
    return apiClient<PaginatedResponse<AuditLog>>(`/admin/audit-logs${toQuery(params)}`);
  },

  runImport(): Promise<ImportReport> {
    return apiClient<ImportReport>('/admin/import', { method: 'POST' });
  },

  /** The price list workbook, filled with the current catalog. */
  downloadPriceList(): Promise<{ blob: Blob; filename: string | null }> {
    return apiBlob('/admin/products/sheet');
  },
  /** Checks the workbook; with `apply` imports it (nothing is written when it has errors). */
  uploadPriceList(file: File, apply: boolean): Promise<SheetImportReport> {
    const form = new FormData();
    form.append('file', file);
    return apiClient<SheetImportReport>(`/admin/products/sheet${toQuery({ apply })}`, { method: 'POST', body: form });
  },
};
