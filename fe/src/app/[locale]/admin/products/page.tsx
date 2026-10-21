'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Plus, Star } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { EmptyRow, PageHeader, selectClass, Table, Td, Th } from '@/features/admin/components/ui';
import ProductStatusBadge from '@/features/admin/components/ProductStatusBadge';
import StockBadge from '@/features/catalog/components/StockBadge';
import { useAppLocale } from '@/features/catalog/hooks';
import { Alert, inputClass } from '@/components/ui/form';
import Pagination from '@/components/ui/Pagination';
import { AdminApi } from '@/lib/api/endpoints';
import { useErrorMessage } from '@/lib/api/errors';
import { formatDateTime, formatPrice } from '@/lib/utils';
import { PRODUCT_STATUSES, type ProductStatus } from '@/types/admin';

/** Product list across all statuses (ADM-02). */
export default function AdminProductsPage() {
  const t = useTranslations('admin.products');
  const tStatus = useTranslations('admin.productStatus');
  const tCommon = useTranslations('common');
  const errorMessage = useErrorMessage();
  const locale = useAppLocale();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ProductStatus | ''>('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);

  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => AdminApi.categories() });
  const params = { q: q.trim() || undefined, status: status || undefined, category: category || undefined, page, size: 20 };
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: () => AdminApi.products(params),
  });

  return (
    <div>
      <PageHeader
        title={t('title')}
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-white px-4 py-2.5 rounded-xl font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            {t('new')}
          </Link>
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder={t('search')}
          aria-label={t('search')}
          className={`${inputClass} max-w-xs`}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ProductStatus | '');
            setPage(0);
          }}
          aria-label={t('status')}
          className={selectClass}
        >
          <option value="">{t('allStatuses')}</option>
          {PRODUCT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {tStatus(s)}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(0);
          }}
          aria-label={t('category')}
          className={selectClass}
        >
          <option value="">{t('allCategories')}</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name[locale] ?? c.name.vi ?? c.slug}
            </option>
          ))}
        </select>
      </div>

      {error && <Alert className="mb-4">{errorMessage(error)}</Alert>}

      <Table>
        <thead>
          <tr>
            <Th>{t('name')}</Th>
            <Th>{t('category')}</Th>
            <Th className="text-right">{t('price')}</Th>
            <Th>{t('stock')}</Th>
            <Th>{t('status')}</Th>
            <Th className="text-right">{t('views')}</Th>
            <Th>{t('updatedAt')}</Th>
          </tr>
        </thead>
        <tbody>
          {isLoading && <EmptyRow colSpan={7}>{tCommon('loading')}</EmptyRow>}
          {data?.content.length === 0 && <EmptyRow colSpan={7}>{t('empty')}</EmptyRow>}
          {data?.content.map((p) => (
            <tr key={p.id} className="hover:bg-paper">
              <Td>
                <Link href={`/admin/products/${p.id}`} className="font-semibold text-ink hover:text-honey-700">
                  {p.featured && <Star className="inline w-3.5 h-3.5 text-honey fill-honey mr-1 -mt-0.5" />}
                  {p.name}
                </Link>
                <p className="text-xs text-slate-400 font-mono">{p.slug}</p>
              </Td>
              <Td>{p.categorySlug}</Td>
              <Td className="text-right whitespace-nowrap">{formatPrice(p.price) ?? '—'}</Td>
              <Td>
                <StockBadge status={p.stockStatus} />
              </Td>
              <Td>
                <ProductStatusBadge status={p.status} />
              </Td>
              <Td className="text-right font-mono">{p.viewCount}</Td>
              <Td className="whitespace-nowrap text-xs text-slate-500">{formatDateTime(p.updatedAt, locale)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
