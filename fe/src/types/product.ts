export type Locale = 'vi' | 'en' | 'zh';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'PRE_ORDER';

export interface NamedRef {
  slug: string;
  name: string;
}

export interface ProductImage {
  url: string;
  alt: string;
}

export interface SpecRow {
  key: string;
  label: string;
  value: string;
}

/** List item DTO returned by `GET /products`. */
export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: NamedRef;
  subCategory: NamedRef | null;
  /** VND; null means "contact for price". */
  price: number | null;
  stockStatus: StockStatus;
  featured: boolean;
  shortDescription: string;
  image: ProductImage | null;
}

/** Detail DTO returned by `GET /products/{slug}`. */
export interface ProductDetail extends ProductSummary {
  description: string;
  highlights: string[];
  useCases: string[];
  notes: string[];
  specs: SpecRow[];
  images: ProductImage[];
  sources: string[];
  /** Attribution / license text for third-party photos (from `CREDITS.txt`). */
  imageCredits: string | null;
}

export type ProductSort = 'featured' | 'price-asc' | 'price-desc' | 'newest';

export interface ProductFilterParams {
  category?: string;
  sub?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  stock?: StockStatus;
  q?: string;
  sort?: ProductSort;
  page?: number;
  size?: number;
}
