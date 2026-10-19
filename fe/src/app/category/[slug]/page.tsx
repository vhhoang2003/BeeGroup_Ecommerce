'use client';

import React, { Suspense, use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CatalogApi } from '@/lib/api/endpoints';
import CatalogBrowser from '@/features/catalog/components/CatalogBrowser';

export default function CategoryPage({ params }: PageProps<'/category/[slug]'>) {
  const { slug } = use(params);
  const { data: category, isLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => CatalogApi.getCategory(slug),
  });

  if (!isLoading && !category) {
    return (
      <div className="max-w-[1240px] mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-[#222222] mb-3">Không tìm thấy danh mục</h2>
        <p className="text-gray-500 mb-6">Danh mục bạn tìm không tồn tại hoặc đã được đổi tên.</p>
        <Link href="/products" className="bg-[#008ECC] text-white px-6 py-2.5 rounded-full font-semibold">
          Xem tất cả sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#008ECC]">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-[#008ECC]">
          Sản phẩm
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#222222]">{category?.name ?? '…'}</span>
      </nav>

      <Suspense fallback={<div className="py-12 text-center text-gray-500">Đang tải sản phẩm…</div>}>
        <CatalogBrowser category={slug} title={category?.name ?? '…'} />
      </Suspense>
    </div>
  );
}
