'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/features/admin/components/ui';
import { useAppLocale } from '@/features/catalog/hooks';
import { Alert, Button, Card, Spinner, inputClass } from '@/components/ui/form';
import { LOCALE_LABELS, routing } from '@/i18n/routing';
import { AdminApi } from '@/lib/api/endpoints';
import { useErrorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/utils';
import type { AdminCategory, LocalizedText } from '@/types/admin';

interface EditorValues {
  slug: string;
  name: LocalizedText;
  sortOrder: number;
  imageUrl?: string;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Categories and sub-categories with their order (ADM-04). Names fall back to `vi` on the site. */
export default function AdminCategoriesPage() {
  const t = useTranslations('admin.categories');
  const tCommon = useTranslations('common');
  const errorMessage = useErrorMessage();
  const client = useQueryClient();
  const [adding, setAdding] = useState(false);
  const query = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => AdminApi.categories() });

  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['admin', 'categories'] });
    void client.invalidateQueries({ queryKey: ['categories'] });
  };

  return (
    <div>
      <PageHeader
        title={t('title')}
        actions={
          !adding && (
            <Button onClick={() => setAdding(true)}>
              <Plus className="w-4 h-4" />
              {t('add')}
            </Button>
          )
        }
      />
      {query.isLoading && <Spinner label={tCommon('loading')} />}
      {query.error && <Alert>{errorMessage(query.error)}</Alert>}

      {adding && (
        <Card className="mb-6">
          <h2 className="font-bold text-[#222222] mb-3">{t('add')}</h2>
          <Editor
            withImage
            initial={{ slug: '', name: {}, sortOrder: (query.data?.length ?? 0) * 10, imageUrl: '' }}
            onCancel={() => setAdding(false)}
            onSave={async (v) => {
              await AdminApi.createCategory({ ...v, imageUrl: v.imageUrl || null });
              setAdding(false);
              refresh();
            }}
          />
        </Card>
      )}

      <div className="space-y-4">
        {query.data?.map((category) => (
          <CategoryCard key={category.id} category={category} onChange={refresh} />
        ))}
      </div>
    </div>
  );
}

function CategoryCard({ category, onChange }: { category: AdminCategory; onChange: () => void }) {
  const t = useTranslations('admin.categories');
  const errorMessage = useErrorMessage();
  const locale = useAppLocale();
  const [editing, setEditing] = useState(false);
  const [addingSub, setAddingSub] = useState(false);
  const [editingSub, setEditingSub] = useState<string | null>(null);
  const [error, setError] = useState('');

  const guard = async (action: () => Promise<unknown>) => {
    setError('');
    try {
      await action();
      onChange();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Card>
      {error && <Alert className="mb-3">{error}</Alert>}
      {editing ? (
        <Editor
          withImage
          initial={{ slug: category.slug, name: category.name, sortOrder: category.sortOrder, imageUrl: category.imageUrl ?? '' }}
          onCancel={() => setEditing(false)}
          onSave={async (v) => {
            await AdminApi.updateCategory(category.id, { ...v, imageUrl: v.imageUrl || null });
            setEditing(false);
            onChange();
          }}
        />
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#222222]">{category.name[locale] ?? category.name.vi}</h2>
            <p className="text-xs text-gray-500">
              <span className="font-mono">{category.slug}</span> · {t('order', { n: category.sortOrder })} ·{' '}
              {t('productCount', { count: category.productCount })}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {routing.locales.map((l) => `${l}: ${category.name[l] ?? '—'}`).join(' · ')}
            </p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" onClick={() => setEditing(true)} aria-label={t('edit')}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              className="text-red-600"
              aria-label={t('delete')}
              onClick={() => {
                if (window.confirm(t('deleteConfirm'))) void guard(() => AdminApi.deleteCategory(category.id));
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('subCategories')}</h3>
          {!addingSub && (
            <Button variant="ghost" onClick={() => setAddingSub(true)}>
              <Plus className="w-4 h-4" />
              {t('addSub')}
            </Button>
          )}
        </div>
        <ul className="divide-y divide-gray-100">
          {category.subCategories.map((sub) => (
            <li key={sub.id} className="py-2">
              {editingSub === sub.id ? (
                <Editor
                  initial={{ slug: sub.slug, name: sub.name, sortOrder: sub.sortOrder }}
                  onCancel={() => setEditingSub(null)}
                  onSave={async (v) => {
                    await AdminApi.updateSubCategory(category.id, sub.id, v);
                    setEditingSub(null);
                    onChange();
                  }}
                />
              ) : (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    <span className="font-semibold text-[#222222]">{sub.name[locale] ?? sub.name.vi}</span>{' '}
                    <span className="text-xs text-gray-400 font-mono">{sub.slug}</span>{' '}
                    <span className="text-xs text-gray-500">
                      · {t('order', { n: sub.sortOrder })} · {t('productCount', { count: sub.productCount })}
                    </span>
                  </span>
                  <span className="flex gap-1">
                    <Button variant="ghost" onClick={() => setEditingSub(sub.id)} aria-label={t('edit')}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-600"
                      aria-label={t('delete')}
                      onClick={() => {
                        if (window.confirm(t('deleteSubConfirm'))) {
                          void guard(() => AdminApi.deleteSubCategory(category.id, sub.id));
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
        {addingSub && (
          <div className="mt-2">
            <Editor
              initial={{ slug: '', name: {}, sortOrder: category.subCategories.length * 10 }}
              onCancel={() => setAddingSub(false)}
              onSave={async (v) => {
                await AdminApi.addSubCategory(category.id, v);
                setAddingSub(false);
                onChange();
              }}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

/** Inline form for a category or sub-category: slug, one name per locale (vi required), order, image. */
function Editor({
  initial,
  withImage,
  onSave,
  onCancel,
}: {
  initial: EditorValues;
  withImage?: boolean;
  onSave: (values: EditorValues) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations('admin.categories');
  const tCommon = useTranslations('common');
  const errorMessage = useErrorMessage();
  const [values, setValues] = useState<EditorValues>(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!SLUG.test(values.slug)) {
      setError(t('slugInvalid'));
      return;
    }
    if (!values.name.vi?.trim()) {
      setError(t('nameRequired'));
      return;
    }
    const name: LocalizedText = {};
    for (const l of routing.locales) if (values.name[l]?.trim()) name[l] = values.name[l]!.trim();
    setBusy(true);
    setError('');
    try {
      await onSave({ ...values, name });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-[#F9FBFD] border border-gray-200 p-3">
      {error && <Alert>{error}</Alert>}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-3">
        <input
          value={values.slug}
          onChange={(e) => setValues({ ...values, slug: e.target.value })}
          placeholder={t('slug')}
          aria-label={t('slug')}
          className={cn(inputClass, 'font-mono')}
          required
        />
        <input
          type="number"
          min={0}
          value={values.sortOrder}
          onChange={(e) => setValues({ ...values, sortOrder: Number(e.target.value) || 0 })}
          aria-label={t('sortOrder')}
          title={t('sortOrder')}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {routing.locales.map((l) => (
          <input
            key={l}
            value={values.name[l] ?? ''}
            maxLength={100}
            onChange={(e) => setValues({ ...values, name: { ...values.name, [l]: e.target.value } })}
            placeholder={`${t('name')} (${LOCALE_LABELS[l]})${l === 'vi' ? ' *' : ''}`}
            aria-label={`${t('name')} (${LOCALE_LABELS[l]})`}
            className={inputClass}
          />
        ))}
      </div>
      {withImage && (
        <input
          value={values.imageUrl ?? ''}
          maxLength={500}
          onChange={(e) => setValues({ ...values, imageUrl: e.target.value })}
          placeholder={t('imageUrl')}
          aria-label={t('imageUrl')}
          className={inputClass}
        />
      )}
      <div className="flex gap-2">
        <Button type="submit" loading={busy}>
          {tCommon('save')}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          {tCommon('cancel')}
        </Button>
      </div>
    </form>
  );
}
