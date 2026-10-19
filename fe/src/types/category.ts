export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  itemCount?: number;
  featured?: boolean;
}

export interface BrandBanner {
  id: string;
  name: string;
  tag: string;
  headline: string;
  discount: string;
  bgClass: string;
  bgColor: string;
  textColor: string;
  logo: string;
  productImage: string;
  link: string;
}
