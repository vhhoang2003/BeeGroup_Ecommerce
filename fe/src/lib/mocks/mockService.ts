import { Product, ProductFilterParams } from '@/types/product';
import { Category, BrandBanner } from '@/types/category';
import { PaginatedResponse } from '@/types/api';
import {
  allMockProducts,
  mockSmartphoneDeals,
  mockCategories,
  mockBrandBanners,
  mockDailyEssentials,
  DailyEssentialItem,
} from './data';

// Simulating network latency for realistic loading/suspense behavior
const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockCatalogService {
  static async getSmartphoneDeals(): Promise<Product[]> {
    await delay(150);
    return [...mockSmartphoneDeals];
  }

  static async getCategories(): Promise<Category[]> {
    await delay(100);
    return [...mockCategories];
  }

  static async getBrandBanners(): Promise<BrandBanner[]> {
    await delay(100);
    return [...mockBrandBanners];
  }

  static async getDailyEssentials(): Promise<DailyEssentialItem[]> {
    await delay(100);
    return [...mockDailyEssentials];
  }

  static async getProducts(params?: ProductFilterParams): Promise<PaginatedResponse<Product>> {
    await delay(200);
    let items = [...allMockProducts];

    if (params?.category) {
      items = items.filter(
        (p) => p.categorySlug.toLowerCase() === params.category?.toLowerCase() ||
               p.category.toLowerCase() === params.category?.toLowerCase()
      );
    }

    if (params?.brand) {
      items = items.filter(
        (p) => p.brand.toLowerCase() === params.brand?.toLowerCase()
      );
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (params?.minPrice !== undefined) {
      items = items.filter((p) => p.price >= (params.minPrice || 0));
    }
    if (params?.maxPrice !== undefined) {
      items = items.filter((p) => p.price <= (params.maxPrice || Infinity));
    }

    if (params?.sortBy) {
      switch (params.sortBy) {
        case 'price-asc':
          items.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          items.sort((a, b) => b.price - a.price);
          break;
        case 'discount':
          items.sort((a, b) => b.discountPercentage - a.discountPercentage);
          break;
        case 'rating':
          items.sort((a, b) => b.rating - a.rating);
          break;
      }
    }

    const page = params?.page || 0;
    const limit = params?.limit || 12;
    const start = page * limit;
    const paginatedItems = items.slice(start, start + limit);

    return {
      content: paginatedItems,
      pageNumber: page,
      pageSize: limit,
      totalElements: items.length,
      totalPages: Math.ceil(items.length / limit),
      last: start + limit >= items.length,
    };
  }

  static async getProductBySlugOrId(idOrSlug: string): Promise<Product | null> {
    await delay(150);
    const product = allMockProducts.find(
      (p) => p.id === idOrSlug || p.slug === idOrSlug
    );
    return product || null;
  }

  static async searchSuggestions(query: string): Promise<Product[]> {
    if (!query || query.trim().length === 0) return [];
    await delay(100);
    const q = query.toLowerCase().trim();
    return allMockProducts
      .filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
      .slice(0, 5);
  }
}
