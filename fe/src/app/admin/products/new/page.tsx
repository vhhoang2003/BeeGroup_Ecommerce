'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '@/features/admin/components/ProductForm';
import { emptyProductForm } from '@/features/admin/productForm';
import { AdminProductsApi } from '@/lib/api/admin';
import type { ProductRequest } from '@/types/admin';

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const create = async (request: ProductRequest) => {
    const product = await AdminProductsApi.create(request);
    queryClient.setQueryData(['admin', 'product', product.id], product);
    await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    // Images need the product id, so they are added on the edit page.
    router.replace(`/admin/products/${product.id}`);
    return product;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#008ECC]">
        <ArrowLeft className="w-4 h-4" />
        Sản phẩm
      </Link>
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#222222]">Thêm sản phẩm</h1>
        <p className="text-xs text-gray-500 mt-0.5">Sau khi tạo, bạn sẽ được chuyển sang trang sửa để tải ảnh lên.</p>
      </div>
      <ProductForm mode="create" initialValues={emptyProductForm()} onSubmit={create} />
    </div>
  );
}
