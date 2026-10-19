export interface SubCategory {
  slug: string;
  name: string;
  itemCount: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  itemCount: number;
  subCategories: SubCategory[];
}
