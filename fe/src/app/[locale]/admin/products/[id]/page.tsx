'use client';

import React, { use, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ExternalLink, Trash2 } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { PageHeader } from '@/features/admin/components/ui';
import ProductForm from '@/features/admin/components/ProductForm';
import ProductImages from '@/features/admin/components/ProductImages';
import ProductStatusBadge from '@/features/admin/components/ProductStatusBadge';
import { fromProduct } from '@/features/admin/productForm';
import { useAppLocale } from '@/features/catalog/hooks';
import { Alert, Button, Spinner } from '@/components/ui/form';
import { AdminApi } from '@/lib/api/endpoints';
import { useErrorMessage } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/utils';

export default function EditProductPage({ params }: PageProps<'/[locale]/admin/products/[id]'>) {
  const { id } = use(params);
  const t = useTranslations('admin.products');
  const tCommon = useTranslations('common');
  const errorMessage = useErrorMessage();
  const locale = useAppLocale();
  const router = useRouter();
  const client = useQueryClient();
  const [deleteError, setDeleteError] = useState('');

  const query = useQuery({ queryKey: ['admin', 'product', id], queryFn: () => AdminApi.product(id) });
  const product = query.data;

  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['admin', 'product', id] });
    void client.invalidateQueries({ queryKey: ['admin', 'products'] });
  };

  const remove = async () => {
    if (!product || !window.confirm(t('deleteConfirm', { name: product.translations.vi?.name ?? product.slug }))) return;
    try {
      await AdminApi.deleteProduct(product.id);
      await client.invalidateQueries({ queryKey: ['admin', 'products'] });
      router.replace('/admin/products');
    } catch (err) {
      setDeleteError(errorMessage(err));
    }
  };

  if (query.isLoading) return <Spinner label={tCommon('loading')} />;
  if (query.error || !product) return <Alert>{errorMessage(query.error)}</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.translations.vi?.name ?? product.slug}
        subtitle={t('meta', {
          views: product.viewCount,
          updated: formatDateTime(product.updatedAt, locale),
        })}
        actions={
          <>
            <ProductStatusBadge status={product.status} className="self-center" />
            {product.status === 'PUBLISHED' && (
              <Link
                href={`/products/${product.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-honey-700 hover:underline px-3 py-2"
              >
                <ExternalLink className="w-4 h-4" />
                {t('viewOnSite')}
              </Link>
            )}
            <Button variant="secondary" onClick={remove} className="text-red-600">
              <Trash2 className="w-4 h-4" />
              {t('delete')}
            </Button>
          </>
        }
      />
      {deleteError && <Alert>{deleteError}</Alert>}

      <ProductImages product={product} onChange={refresh} />

      <ProductForm
        key={product.id}
        initial={fromProduct(product)}
        submitLabel={t('save')}
        onSubmit={async (request) => {
          const updated = await AdminApi.updateProduct(product.id, request);
          client.setQueryData(['admin', 'product', id], updated);
          void client.invalidateQueries({ queryKey: ['admin', 'products'] });
        }}
      />
    </div>
  );
}
