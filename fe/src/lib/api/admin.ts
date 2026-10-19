import { apiClient } from './client';
import { toQuery } from './endpoints';
import type { PaginatedResponse } from '@/types/api';
import type {
  AdminCategory,
  AdminImage,
  AdminProduct,
  AdminProductListItem,
  AdminProductListParams,
  LocalizedMap,
  ProductRequest,
  ProductStatus,
} from '@/types/admin';

/** `/api/v1/admin/products` (ADM-02, ADM-03). Requires an ADMIN session. */
export const AdminProductsApi = {
  list(params: AdminProductListParams = {}) {
    return apiClient<PaginatedResponse<AdminProductListItem>>(`/admin/products${toQuery({ ...params })}`);
  },

  get(id: string) {
    return apiClient<AdminProduct>(`/admin/products/${id}`);
  },

  create(req: ProductRequest) {
    return apiClient<AdminProduct>('/admin/products', { method: 'POST', body: JSON.stringify(req) });
  },

  update(id: string, req: ProductRequest) {
    return apiClient<AdminProduct>(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(req) });
  },

  remove(id: string) {
    return apiClient<void>(`/admin/products/${id}`, { method: 'DELETE' });
  },

  setStatus(id: string, status: ProductStatus) {
    return apiClient<AdminProduct>(`/admin/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  /** JPEG / PNG / WebP up to 5 MB; the API re-encodes it to WebP variants. */
  uploadImage(id: string, file: File, altVi?: string) {
    const form = new FormData();
    form.append('file', file);
    if (altVi) form.append('altVi', altVi);
    return apiClient<AdminImage>(`/admin/products/${id}/images`, { method: 'POST', body: form });
  },

  /** `sortOrder` moves the image to that position; `primary` moves it first. */
  updateImage(id: string, imageId: string, patch: { sortOrder?: number; primary?: boolean; alt?: LocalizedMap }) {
    return apiClient<AdminProduct>(`/admin/products/${id}/images/${imageId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  deleteImage(id: string, imageId: string) {
    return apiClient<void>(`/admin/products/${id}/images/${imageId}`, { method: 'DELETE' });
  },
};

/** `/api/v1/admin/categories` (ADM-04); only listing is used for now, by the product form. */
export const AdminCategoriesApi = {
  list() {
    return apiClient<AdminCategory[]>('/admin/categories');
  },
};
