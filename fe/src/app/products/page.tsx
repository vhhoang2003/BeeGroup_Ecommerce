'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CatalogBrowser from '@/features/catalog/components/CatalogBrowser';

function ProductsTitle() {
  const q = useSearchParams().get('q');
  return <>{q ? `Kết quả tìm kiếm cho “${q}”` : 'Tất cả sản phẩm'}</>;
}

export default function ProductsPage() {
  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 sm:py-8">
      <Suspense fallback={<div className="py-12 text-center text-gray-500">Đang tải sản phẩm…</div>}>
        <CatalogBrowser title={<ProductsTitle />} />
      </Suspense>
    </div>
  );
}
