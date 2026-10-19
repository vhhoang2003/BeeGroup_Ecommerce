'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { AdminProductsApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import type { ProductStatus } from '@/types/admin';
import { formatPrice, stockStatusLabel } from '@/lib/utils';
import { PRODUCT_STATUS_LABELS } from '@/features/admin/productForm';
import { ErrorBox, StatusBadge, buttonClass, inputClass } from './ui';

const PAGE_SIZE = 20;

export default function ProductList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ProductStatus | ''>('');
  const [page, setPage] = useState(0);

  const params = { q: q || undefined, status: status || undefined, page, size: PAGE_SIZE };
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: () => AdminProductsApi.list(params),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (id: string) => AdminProductsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Xoá vĩnh viễn sản phẩm "${name}" cùng toàn bộ ảnh? Không thể hoàn tác.`)) {
      remove.mutate(id);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(search.trim());
    setPage(0);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#222222]">Sản phẩm</h1>
          {data && <p className="text-xs text-gray-500 mt-0.5">{data.totalElements} sản phẩm</p>}
        </div>
        <Link href="/admin/products/new" className={buttonClass.primary}>
          <Plus className="w-4 h-4" />
          Thêm sản phẩm
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, slug, SKU… (Enter)"
            className={`${inputClass} pl-9`}
          />
        </form>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ProductStatus | '');
            setPage(0);
          }}
          className={`${inputClass} sm:w-48`}
          aria-label="Lọc theo trạng thái"
        >
          <option value="">Tất cả trạng thái</option>
          {(Object.keys(PRODUCT_STATUS_LABELS) as ProductStatus[]).map((s) => (
            <option key={s} value={s}>
              {PRODUCT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {error && <ErrorBox>Không tải được danh sách: {error instanceof ApiError ? error.message : String(error)}</ErrorBox>}
      {remove.error && <ErrorBox>Không xoá được: {remove.error.message}</ErrorBox>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Sản phẩm</th>
              <th className="px-4 py-3 hidden md:table-cell">Danh mục</th>
              <th className="px-4 py-3 text-right">Giá</th>
              <th className="px-4 py-3 hidden lg:table-cell">Tồn kho</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 hidden lg:table-cell">Cập nhật</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  <Loader2 className="w-5 h-5 text-[#008ECC] animate-spin inline" />
                </td>
              </tr>
            )}
            {data?.content.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  Không có sản phẩm nào.
                </td>
              </tr>
            )}
            {data?.content.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${p.id}`} className="font-semibold text-[#222222] hover:text-[#008ECC]">
                    {p.name}
                  </Link>
                  {p.featured && <Star className="w-3.5 h-3.5 text-[#F5B301] fill-[#F5B301] inline ml-1.5 -mt-0.5" aria-label="Nổi bật" />}
                  <p className="text-xs text-gray-400">
                    {p.brand} · {p.slug}
                  </p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-600">{p.categorySlug}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{formatPrice(p.price)}</td>
                <td className="px-4 py-3 hidden lg:table-cell text-gray-600 whitespace-nowrap">{stockStatusLabel[p.stockStatus]}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500 whitespace-nowrap">
                  {new Date(p.updatedAt).toLocaleString('vi-VN')}
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center justify-end gap-0.5">
                    {p.status === 'PUBLISHED' && (
                      <a href={`/products/${p.slug}`} target="_blank" rel="noreferrer" className={buttonClass.icon} title="Xem trên trang">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <Link href={`/admin/products/${p.id}`} className={buttonClass.icon} title="Sửa">
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={remove.isPending}
                      className={`${buttonClass.icon} hover:text-red-600`}
                      title="Xoá"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          {isFetching && <Loader2 className="w-4 h-4 text-[#008ECC] animate-spin" />}
          <span className="text-gray-500">
            Trang {data.pageNumber + 1}/{data.totalPages}
          </span>
          <button type="button" className={buttonClass.icon} disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Trang trước">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" className={buttonClass.icon} disabled={data.last} onClick={() => setPage((p) => p + 1)} aria-label="Trang sau">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
