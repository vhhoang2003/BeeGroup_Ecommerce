'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import ProductForm from '@/features/admin/components/ProductForm';
import ImageManager from '@/features/admin/components/ImageManager';
import { ErrorBox, StatusBadge, buttonClass } from '@/features/admin/components/ui';
import { fromProduct } from '@/features/admin/productForm';
import { AdminProductsApi } from '@/lib/api/admin';
import type { ProductRequest } from '@/types/admin';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const queryKey = ['admin', 'product', id];

  const { data: product, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => AdminProductsApi.get(id),
  });

  const remove = useMutation({
    mutationFn: () => AdminProductsApi.remove(id),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      router.replace('/admin/products');
    },
  });

  const save = async (request: ProductRequest) => {
    const updated = await AdminProductsApi.update(id, request);
    queryClient.setQueryData(queryKey, updated);
    await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    return updated;
  };

  if (isLoading) {
    return <Loader2 className="w-6 h-6 text-[#008ECC] animate-spin mx-auto mt-20" />;
  }
  if (error || !product) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <ErrorBox>Không tải được sản phẩm: {error?.message ?? 'không tồn tại'}</ErrorBox>
        <Link href="/admin/products" className={buttonClass.secondary}>
          <ArrowLeft className="w-4 h-4" />
          Về danh sách
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    const name = product.translations.vi?.name ?? product.slug;
    if (window.confirm(`Xoá vĩnh viễn sản phẩm "${name}" cùng toàn bộ ảnh? Không thể hoàn tác.`)) {
      remove.mutate();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#008ECC]">
        <ArrowLeft className="w-4 h-4" />
        Sản phẩm
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#222222] truncate">
              {product.translations.vi?.name ?? product.slug}
            </h1>
            <StatusBadge status={product.status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {product.viewCount} lượt xem · cập nhật {new Date(product.updatedAt).toLocaleString('vi-VN')}
          </p>
        </div>
        <div className="flex gap-2">
          {product.status === 'PUBLISHED' && (
            <a href={`/products/${product.slug}`} target="_blank" rel="noreferrer" className={buttonClass.secondary}>
              <ExternalLink className="w-4 h-4" />
              Xem trên trang
            </a>
          )}
          <button type="button" onClick={handleDelete} disabled={remove.isPending} className={buttonClass.danger}>
            <Trash2 className="w-4 h-4" />
            Xoá
          </button>
        </div>
      </div>
      {remove.error && <ErrorBox>Không xoá được: {remove.error.message}</ErrorBox>}

      <ImageManager product={product} />
      <ProductForm key={product.id} mode="edit" initialValues={fromProduct(product)} onSubmit={save} />
    </div>
  );
}
