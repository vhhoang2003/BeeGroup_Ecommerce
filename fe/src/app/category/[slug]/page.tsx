import React from 'react';
import Link from 'next/link';
import { CatalogApi } from '@/lib/api/endpoints';
import ProductCard from '@/features/catalog/components/ProductCard';
import SectionTitle from '@/components/ui/SectionTitle';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const response = await CatalogApi.getProducts({
    category: decodedSlug,
  });

  const products = response.content;

  // Format title
  const categoryTitle = decodedSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#008ECC]">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-[#008ECC]">
          Categories
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#222222]">{categoryTitle}</span>
      </nav>

      <SectionTitle
        prefix="Explore"
        highlight={categoryTitle}
        viewAllHref="/products"
      />

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <h3 className="text-lg font-bold text-[#222222] mb-2">
            No products found in {categoryTitle}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Check out our other available categories or browse our full catalogue.
          </p>
          <Link
            href="/products"
            className="inline-block bg-[#008ECC] hover:bg-[#0077b0] text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
