'use client';

import React, { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { Alert, Button, Card, Field, inputClass } from '@/components/ui/form';
import { LOCALE_LABELS, routing } from '@/i18n/routing';
import { useAppLocale } from '@/features/catalog/hooks';
import { AdminApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useErrorMessage } from '@/lib/api/errors';
import { cn, STOCK_STATUSES } from '@/lib/utils';
import { PRODUCT_STATUSES, type ProductRequest } from '@/types/admin';
import type { Locale } from '@/types/product';
import { emptySpec, type ProductFormValues, slugify, toRequest } from '../productForm';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface ProductFormProps {
  initial: ProductFormValues;
  submitLabel: string;
  onSubmit: (request: ProductRequest) => Promise<void>;
}

/** All product fields (ADM-02): basics, one tab per locale, the spec rows editor and sources. */
export default function ProductForm({ initial, submitLabel, onSubmit }: ProductFormProps) {
  const t = useTranslations('admin.productForm');
  const tStatus = useTranslations('admin.productStatus');
  const tStock = useTranslations('stock');
  const tv = useTranslations('validation');
  const errorMessage = useErrorMessage();
  const uiLocale = useAppLocale();
  const [tab, setTab] = useState<Locale>('vi');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => AdminApi.categories() });

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductFormValues>({ defaultValues: initial });
  const specs = useFieldArray({ control, name: 'specs' });

  const categorySlug = useWatch({ control, name: 'categorySlug' });
  const selectedCategory = categories.data?.find((c) => c.slug === categorySlug);

  const submit = handleSubmit(async (values) => {
    setError('');
    setSaved(false);
    try {
      await onSubmit(toRequest(values));
      // The saved state becomes the new baseline, so later image refetches do not discard unsaved edits.
      reset(values);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SLUG_ALREADY_EXISTS') {
        setFieldError('slug', { type: 'server', message: errorMessage(err) });
      } else if (err instanceof ApiError && err.fields.length > 0) {
        setError(`${errorMessage(err)}: ${err.fields.map((f) => `${f.field} (${f.message})`).join(', ')}`);
      } else {
        setError(errorMessage(err));
      }
    }
  });

  const fillSlug = () => {
    const name = getValues('translations.vi.name') || getValues('translations.en.name');
    if (name) setValue('slug', slugify(name), { shouldDirty: true, shouldValidate: true });
  };

  const tabError = (l: Locale) => !!errors.translations?.[l];

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {error && <Alert>{error}</Alert>}
      {saved && !isDirty && <Alert tone="success">{t('saved')}</Alert>}

      <Card>
        <h2 className="text-base font-bold text-ink mb-4">{t('basics')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field id="pf-slug" label={t('slug')} error={errors.slug?.message} hint={t('slugHint')} required>
            {(a) => (
              <div className="flex gap-2">
                <input
                  {...a}
                  {...register('slug', {
                    required: tv('required'),
                    pattern: { value: SLUG, message: t('slugInvalid') },
                    maxLength: { value: 120, message: tv('max', { max: 120 }) },
                  })}
                  className={cn(inputClass, 'font-mono')}
                />
                <Button variant="secondary" onClick={fillSlug} title={t('slugFromName')} aria-label={t('slugFromName')}>
                  <Wand2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </Field>
          <Field id="pf-sku" label={t('sku')}>
            {(a) => <input {...a} {...register('sku', { maxLength: 50 })} className={inputClass} />}
          </Field>
          <Field id="pf-brand" label={t('brand')} error={errors.brand?.message} required>
            {(a) => <input {...a} {...register('brand', { required: tv('required') })} className={inputClass} />}
          </Field>
          <Field id="pf-price" label={t('price')} error={errors.price?.message} hint={t('priceHint')}>
            {(a) => (
              <input
                {...a}
                {...register('price', { pattern: { value: /^\d*$/, message: t('priceInvalid') } })}
                inputMode="numeric"
                className={inputClass}
              />
            )}
          </Field>
          <Field id="pf-category" label={t('category')} error={errors.categorySlug?.message} required>
            {(a) => (
              <select
                {...a}
                {...register('categorySlug', {
                  required: tv('required'),
                  onChange: () => setValue('subCategorySlug', ''),
                })}
                className={inputClass}
              >
                <option value="">—</option>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name[uiLocale] ?? c.name.vi ?? c.slug}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id="pf-sub" label={t('subCategory')}>
            {(a) => (
              <select {...a} {...register('subCategorySlug')} disabled={!selectedCategory} className={inputClass}>
                <option value="">—</option>
                {selectedCategory?.subCategories.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.name[uiLocale] ?? s.name.vi ?? s.slug}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id="pf-stock" label={t('stock')}>
            {(a) => (
              <select {...a} {...register('stockStatus')} className={inputClass}>
                {STOCK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {tStock(s)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id="pf-status" label={t('status')}>
            {(a) => (
              <select {...a} {...register('status')} className={inputClass}>
                {PRODUCT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {tStatus(s)}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 mt-4 cursor-pointer w-fit">
          <input type="checkbox" {...register('featured')} className="accent-ink w-4 h-4" />
          {t('featured')}
        </label>
      </Card>

      <Card>
        <h2 className="text-base font-bold text-ink mb-1">{t('content')}</h2>
        <p className="text-xs text-slate-500 mb-4">{t('contentHint')}</p>
        <div role="tablist" aria-label={t('content')} className="flex gap-2 mb-4 border-b border-slate-100">
          {routing.locales.map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              id={`tab-${l}`}
              aria-selected={tab === l}
              aria-controls={`panel-${l}`}
              onClick={() => setTab(l)}
              className={cn(
                'px-4 py-2 text-sm font-semibold border-b-2 -mb-px cursor-pointer',
                tab === l ? 'border-honey-500 text-honey-700' : 'border-transparent text-slate-500 hover:text-slate-800',
                tabError(l) && 'text-red-600'
              )}
            >
              {LOCALE_LABELS[l]}
              {l === 'vi' && <span className="text-red-500"> *</span>}
            </button>
          ))}
        </div>

        {routing.locales.map((l) => (
          <div
            key={l}
            role="tabpanel"
            id={`panel-${l}`}
            aria-labelledby={`tab-${l}`}
            hidden={tab !== l}
            className="grid grid-cols-1 gap-4"
          >
            <Field id={`pf-${l}-name`} label={t('name')} error={errors.translations?.[l]?.name?.message} required={l === 'vi'}>
              {(a) => (
                <input
                  {...a}
                  {...register(`translations.${l}.name`, {
                    required: l === 'vi' ? tv('required') : false,
                    maxLength: { value: 200, message: tv('max', { max: 200 }) },
                  })}
                  className={inputClass}
                />
              )}
            </Field>
            <Field id={`pf-${l}-short`} label={t('shortDescription')}>
              {(a) => <input {...a} {...register(`translations.${l}.shortDescription`, { maxLength: 500 })} className={inputClass} />}
            </Field>
            <Field id={`pf-${l}-desc`} label={t('description')}>
              {(a) => <textarea {...a} {...register(`translations.${l}.description`)} rows={5} className={inputClass} />}
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field id={`pf-${l}-hl`} label={t('highlights')} hint={t('onePerLine')}>
                {(a) => <textarea {...a} {...register(`translations.${l}.highlights`)} rows={5} className={inputClass} />}
              </Field>
              <Field id={`pf-${l}-uc`} label={t('useCases')} hint={t('onePerLine')}>
                {(a) => <textarea {...a} {...register(`translations.${l}.useCases`)} rows={5} className={inputClass} />}
              </Field>
              <Field id={`pf-${l}-notes`} label={t('notes')} hint={t('onePerLine')}>
                {(a) => <textarea {...a} {...register(`translations.${l}.notes`)} rows={5} className={inputClass} />}
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field id={`pf-${l}-mt`} label={t('metaTitle')}>
                {(a) => <input {...a} {...register(`translations.${l}.metaTitle`, { maxLength: 200 })} className={inputClass} />}
              </Field>
              <Field id={`pf-${l}-md`} label={t('metaDescription')}>
                {(a) => <input {...a} {...register(`translations.${l}.metaDescription`, { maxLength: 500 })} className={inputClass} />}
              </Field>
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-ink">{t('specs')}</h2>
            <p className="text-xs text-slate-500">{t('specsHint')}</p>
          </div>
          <Button variant="secondary" onClick={() => specs.append(emptySpec())}>
            <Plus className="w-4 h-4" />
            {t('addSpec')}
          </Button>
        </div>
        {specs.fields.length === 0 && <p className="text-sm text-slate-500">{t('noSpecs')}</p>}
        <div className="space-y-3">
          {specs.fields.map((field, index) => (
            <div key={field.id} className="rounded-xl border border-slate-200 p-3 grid grid-cols-1 md:grid-cols-[160px_1fr_1fr_auto] gap-3 items-start">
              <input
                {...register(`specs.${index}.key`)}
                placeholder={t('specKey')}
                aria-label={t('specKey')}
                className={cn(inputClass, 'font-mono')}
              />
              <div className="space-y-1.5">
                {routing.locales.map((l) => (
                  <input
                    key={l}
                    {...register(`specs.${index}.label.${l}`)}
                    placeholder={`${t('specLabel')} (${l})`}
                    aria-label={`${t('specLabel')} (${LOCALE_LABELS[l]})`}
                    className={inputClass}
                  />
                ))}
              </div>
              <div className="space-y-1.5">
                {routing.locales.map((l) => (
                  <input
                    key={l}
                    {...register(`specs.${index}.value.${l}`)}
                    placeholder={`${t('specValue')} (${l})`}
                    aria-label={`${t('specValue')} (${LOCALE_LABELS[l]})`}
                    className={inputClass}
                  />
                ))}
              </div>
              <div className="flex md:flex-col gap-1">
                <Button variant="ghost" onClick={() => index > 0 && specs.move(index, index - 1)} aria-label={t('moveUp')}>
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => index < specs.fields.length - 1 && specs.move(index, index + 1)}
                  aria-label={t('moveDown')}
                >
                  ↓
                </Button>
                <Button variant="ghost" onClick={() => specs.remove(index)} aria-label={t('removeSpec')} className="text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Field id="pf-sources" label={t('sources')} hint={t('onePerLine')}>
          {(a) => <textarea {...a} {...register('sources')} rows={3} className={cn(inputClass, 'font-mono text-xs')} />}
        </Field>
      </Card>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button type="submit" loading={isSubmitting} className="shadow-lg px-8">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
