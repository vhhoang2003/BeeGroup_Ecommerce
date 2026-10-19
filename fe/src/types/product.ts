export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  categorySlug: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  savings: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  image: string;
  images?: string[];
  specs?: { [key: string]: string };
  description: string;
  features?: string[];
  isFeatured?: boolean;
  isDailyEssential?: boolean;
}

export interface ProductFilterParams {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'discount' | 'rating';
  page?: number;
  limit?: number;
}
