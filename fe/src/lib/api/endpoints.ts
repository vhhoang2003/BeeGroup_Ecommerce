import { USE_MOCK, apiClient } from './client';
import { MockCatalogService } from '../mocks/mockService';
import { Product, ProductFilterParams } from '@/types/product';
import { Category, BrandBanner } from '@/types/category';
import { PaginatedResponse } from '@/types/api';
import { DailyEssentialItem } from '../mocks/data';
import { Order, CheckoutFormData } from '@/types/order';

export const CatalogApi = {
  async getSmartphoneDeals(): Promise<Product[]> {
    if (USE_MOCK) return MockCatalogService.getSmartphoneDeals();
    return apiClient<Product[]>('/products/deals/smartphones');
  },

  async getCategories(): Promise<Category[]> {
    if (USE_MOCK) return MockCatalogService.getCategories();
    return apiClient<Category[]>('/categories');
  },

  async getBrandBanners(): Promise<BrandBanner[]> {
    if (USE_MOCK) return MockCatalogService.getBrandBanners();
    return apiClient<BrandBanner[]>('/promotions/brands');
  },

  async getDailyEssentials(): Promise<DailyEssentialItem[]> {
    if (USE_MOCK) return MockCatalogService.getDailyEssentials();
    return apiClient<DailyEssentialItem[]>('/products/deals/essentials');
  },

  async getProducts(params?: ProductFilterParams): Promise<PaginatedResponse<Product>> {
    if (USE_MOCK) return MockCatalogService.getProducts(params);
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.brand) query.set('brand', params.brand);
    if (params?.search) query.set('q', params.search);
    if (params?.sortBy) query.set('sort', params.sortBy);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('size', params.limit.toString());
    return apiClient<PaginatedResponse<Product>>(`/products?${query.toString()}`);
  },

  async getProduct(idOrSlug: string): Promise<Product | null> {
    if (USE_MOCK) return MockCatalogService.getProductBySlugOrId(idOrSlug);
    return apiClient<Product>(`/products/${idOrSlug}`);
  },

  async searchSuggestions(q: string): Promise<Product[]> {
    if (USE_MOCK) return MockCatalogService.searchSuggestions(q);
    return apiClient<Product[]>(`/products/suggestions?q=${encodeURIComponent(q)}`);
  },
};

export const OrderApi = {
  async createOrder(checkoutData: CheckoutFormData, items: unknown[]): Promise<Order> {
    if (USE_MOCK) {
      // Mock successful order creation
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
      const newOrder: Order = {
        id: orderId,
        orderNumber: orderId,
        userId: 'guest-user',
        items: items as never,
        shippingAddress: {
          fullName: checkoutData.fullName,
          phone: checkoutData.phone,
          street: checkoutData.street,
          city: checkoutData.city,
          state: checkoutData.state,
          postalCode: checkoutData.postalCode,
          country: 'India',
        },
        paymentMethod: checkoutData.paymentMethod,
        subtotal: 32999,
        discount: 4500,
        shippingFee: 0,
        total: 28499,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-IN', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
      };
      return newOrder;
    }
    return apiClient<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify({ ...checkoutData, items }),
    });
  },
};
