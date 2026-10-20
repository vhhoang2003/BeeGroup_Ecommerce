'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { PageHeader } from '@/features/admin/components/ui';
import ProductForm from '@/features/admin/components/ProductForm';
import { emptyProductForm } from '@/features/admin/productForm';
import { AdminApi } from '@/lib/api/endpoints';

const initial = emptyProductForm();

/** New product; images can be added once it exists, so this opens the edit page after saving. */
export default function NewProductPage() {
  const t = useTranslations('admin.products');
  const router = useRouter();
  const client = useQueryClient();

  return (
    <div>
      <PageHeader title={t('new')} subtitle={t('newHint')} />
      <ProductForm
        initial={initial}
        submitLabel={t('create')}
        onSubmit={async (request) => {
          const created = await AdminApi.createProduct(request);
          await client.invalidateQueries({ queryKey: ['admin', 'products'] });
          router.replace(`/admin/products/${created.id}`);
        }}
      />
    </div>
  );
}
