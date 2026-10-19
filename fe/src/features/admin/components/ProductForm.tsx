'use client';

import React, { useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { AdminCategoriesApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import type { AdminProduct, ProductRequest } from '@/types/admin';
import type { Locale } from '@/types/product';
import { cn, stockStatusLabel } from '@/lib/utils';
import {
  LOCALES,
  LOCALE_LABELS,
  PRODUCT_STATUS_LABELS,
  STOCK_STATUSES,
  type ProductFormValues,
  emptySpec,
  productFormSchema,
  slugify,
  toProductRequest,
} from '@/features/admin/productForm';
import { Card, ErrorBox, Field, buttonClass, inputClass } from './ui';

interface ProductFormProps {
  initialValues: ProductFormValues;
  /** Create mode derives the slug from the Vietnamese name until the slug is edited by hand. */
  mode: 'create' | 'edit';
  onSubmit: (request: ProductRequest) => Promise<AdminProduct>;
}

const textareaClass = `${inputClass} min-h-[96px] leading-relaxed`;

export default function ProductForm({ initialValues, mode, onSubmit }: ProductFormProps) {
  const [locale, setLocale] = useState<Locale>('vi');
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');
  const [serverError, setServerError] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialValues,
  });
  const specs = useFieldArray({ control, name: 'specs' });

  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: AdminCategoriesApi.list });
  const [viName, categorySlug] = useWatch({ control, name: ['translations.vi.name', 'categorySlug'] });
  const subCategories = categories.data?.find((c) => c.slug === categorySlug)?.subCategories ?? [];

  useEffect(() => {
    if (!slugTouched) setValue('slug', slugify(viName ?? ''), { shouldValidate: false });
  }, [viName, slugTouched, setValue]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const submit = handleSubmit(async (values) => {
    setServerError([]);
    setSaved(false);
    try {
      await onSubmit(toProductRequest(values));
      if (mode === 'edit') {
        reset(values);
        setSaved(true);
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === 'SLUG_ALREADY_EXISTS') {
        setError('slug', { message: 'Slug này đã được dùng cho sản phẩm khác' });
      } else if (error instanceof ApiError && error.fields.length > 0) {
        setServerError(error.fields.map((f) => `${f.field}: ${f.message}`));
      } else {
        setServerError([error instanceof Error ? error.message : 'Không lưu được sản phẩm']);
      }
    }
  });

  const localeHasError = (l: Locale) => Boolean(errors.translations?.[l]);

  // Native selects drop a value that has no matching option yet, so render the fields once the categories are in.
  if (categories.isLoading) {
    return <Loader2 className="w-6 h-6 text-[#008ECC] animate-spin mx-auto mt-10" />;
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {categories.error && <ErrorBox>Không tải được danh mục: {categories.error.message}</ErrorBox>}
      {serverError.length > 0 && (
        <ErrorBox>
          {serverError.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </ErrorBox>
      )}

      <Card title="Thông tin chung">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tên sản phẩm (tiếng Việt)" required error={errors.translations?.vi?.name?.message} className="sm:col-span-2">
            <input {...register('translations.vi.name')} className={inputClass} placeholder="CPU AMD EPYC 7402" />
          </Field>
          <Field
            label="Slug (đường dẫn)"
            required
            error={errors.slug?.message}
            hint={mode === 'create' ? 'Tự tạo từ tên; có thể sửa.' : 'Đổi slug sẽ đổi đường dẫn của sản phẩm.'}
          >
            <input
              {...register('slug', { onChange: () => setSlugTouched(true) })}
              className={inputClass}
              placeholder="cpu-amd-epyc-7402"
            />
          </Field>
          <Field label="SKU" error={errors.sku?.message}>
            <input {...register('sku')} className={inputClass} />
          </Field>
          <Field label="Hãng" required error={errors.brand?.message}>
            <input {...register('brand')} className={inputClass} placeholder="AMD" />
          </Field>
          <Field label="Giá (₫)" error={errors.price?.message} hint="Để trống để hiển thị “Liên hệ”.">
            <input {...register('price')} inputMode="numeric" className={inputClass} placeholder="3380000" />
          </Field>
          <Field label="Danh mục" required error={errors.categorySlug?.message}>
            <select
              {...register('categorySlug', { onChange: () => setValue('subCategorySlug', '') })}
              className={inputClass}
            >
              <option value="">— Chọn danh mục —</option>
              {categories.data?.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name.vi ?? c.slug}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Danh mục con">
            <select {...register('subCategorySlug')} className={inputClass} disabled={subCategories.length === 0}>
              <option value="">— Không —</option>
              {subCategories.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name.vi ?? s.slug}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tình trạng kho">
            <select {...register('stockStatus')} className={inputClass}>
              {STOCK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {stockStatusLabel[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Trạng thái" hint="Chỉ sản phẩm “Đang hiển thị” xuất hiện trên trang.">
            <select {...register('status')} className={inputClass}>
              {(Object.keys(PRODUCT_STATUS_LABELS) as (keyof typeof PRODUCT_STATUS_LABELS)[]).map((s) => (
                <option key={s} value={s}>
                  {PRODUCT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer sm:col-span-2">
            <input type="checkbox" {...register('featured')} className="accent-[#008ECC] w-4 h-4" />
            Sản phẩm nổi bật (hiện ở trang chủ)
          </label>
        </div>
      </Card>

      <Card
        title="Nội dung"
        actions={
          <div className="flex rounded-lg border border-gray-200 p-0.5 text-xs" role="tablist">
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={locale === l}
                onClick={() => setLocale(l)}
                className={cn(
                  'px-3 py-1 rounded-md font-medium cursor-pointer',
                  locale === l ? 'bg-[#008ECC] text-white' : 'text-gray-600 hover:bg-gray-50',
                  localeHasError(l) && locale !== l && 'text-red-600'
                )}
              >
                {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>
        }
      >
        <p className="text-xs text-gray-500 mb-4">
          {locale === 'vi'
            ? 'Tiếng Việt là bắt buộc. Thông số kỹ thuật bên dưới cũng theo ngôn ngữ đang chọn.'
            : 'Tuỳ chọn: ngôn ngữ này chỉ được lưu khi có tên sản phẩm.'}
        </p>
        {/* All languages stay mounted so their values are kept and validated; only the active one is shown. */}
        {LOCALES.map((l) => (
          <div key={l} className={cn('grid grid-cols-1 gap-4', l !== locale && 'hidden')}>
            {l !== 'vi' && (
              <Field label="Tên sản phẩm" error={errors.translations?.[l]?.name?.message}>
                <input {...register(`translations.${l}.name`)} className={inputClass} />
              </Field>
            )}
            <Field label="Mô tả ngắn" error={errors.translations?.[l]?.shortDescription?.message} hint="Hiện ở thẻ sản phẩm, tối đa 500 ký tự.">
              <textarea {...register(`translations.${l}.shortDescription`)} className={textareaClass} rows={2} />
            </Field>
            <Field label="Mô tả chi tiết" hint="Xuống dòng được giữ nguyên khi hiển thị.">
              <textarea {...register(`translations.${l}.description`)} className={`${textareaClass} min-h-[180px]`} rows={8} />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Điểm nổi bật" hint="Mỗi dòng một ý.">
                <textarea {...register(`translations.${l}.highlights`)} className={textareaClass} rows={4} />
              </Field>
              <Field label="Ứng dụng" hint="Mỗi dòng một ý.">
                <textarea {...register(`translations.${l}.useCases`)} className={textareaClass} rows={4} />
              </Field>
              <Field label="Lưu ý" hint="Mỗi dòng một ý.">
                <textarea {...register(`translations.${l}.notes`)} className={textareaClass} rows={4} />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="SEO: tiêu đề" error={errors.translations?.[l]?.metaTitle?.message} hint="Để trống sẽ dùng tên sản phẩm.">
                <input {...register(`translations.${l}.metaTitle`)} className={inputClass} />
              </Field>
              <Field label="SEO: mô tả" error={errors.translations?.[l]?.metaDescription?.message}>
                <input {...register(`translations.${l}.metaDescription`)} className={inputClass} />
              </Field>
            </div>
          </div>
        ))}
      </Card>

      <Card
        title={`Thông số kỹ thuật (${LOCALE_LABELS[locale]})`}
        actions={
          <button type="button" onClick={() => specs.append(emptySpec())} className={buttonClass.secondary}>
            <Plus className="w-4 h-4" />
            Thêm dòng
          </button>
        }
      >
        {specs.fields.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có thông số.</p>
        ) : (
          <div className="space-y-2">
            <div className="hidden sm:grid grid-cols-[1fr_1.2fr_1.6fr_auto] gap-2 text-xs font-semibold text-gray-500 px-0.5">
              <span>Mã (key)</span>
              <span>Nhãn</span>
              <span>Giá trị</span>
              <span className="w-8" />
            </div>
            {specs.fields.map((field, i) => {
              const e = errors.specs?.[i];
              return (
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr_1.6fr_auto] gap-2 items-start">
                  <div>
                    <input {...register(`specs.${i}.key`)} className={inputClass} placeholder="cores" aria-label="Mã" />
                    {e?.key && <span className="text-xs text-red-600">{e.key.message}</span>}
                  </div>
                  {/* Inputs for every language stay registered; only the active language is visible. */}
                  <div>
                    {LOCALES.map((l) => (
                      <input
                        key={l}
                        {...register(`specs.${i}.label.${l}`)}
                        className={cn(inputClass, l !== locale && 'hidden')}
                        placeholder="Số nhân"
                        aria-label={`Nhãn (${l})`}
                      />
                    ))}
                    {e?.label?.vi && <span className="text-xs text-red-600">{e.label.vi.message}</span>}
                  </div>
                  <div>
                    {LOCALES.map((l) => (
                      <input
                        key={l}
                        {...register(`specs.${i}.value.${l}`)}
                        className={cn(inputClass, l !== locale && 'hidden')}
                        placeholder="24 nhân / 48 luồng"
                        aria-label={`Giá trị (${l})`}
                      />
                    ))}
                    {e?.value?.vi && <span className="text-xs text-red-600">{e.value.vi.message}</span>}
                  </div>
                  <button type="button" onClick={() => specs.remove(i)} className={`${buttonClass.icon} hover:text-red-600`} title="Xoá dòng">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="Nguồn tham khảo">
        <Field label="Liên kết" hint="Mỗi dòng một URL (datasheet, trang hãng…).">
          <textarea {...register('sources')} className={textareaClass} rows={3} />
        </Field>
      </Card>

      <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-[#F5F7FA]/95 backdrop-blur border-t border-gray-200 flex items-center justify-end gap-3">
        {Object.keys(errors).length > 0 && <span className="text-xs text-red-600 mr-auto">Vui lòng kiểm tra các trường được đánh dấu.</span>}
        {saved && !isDirty && <span className="text-xs text-green-700 mr-auto">Đã lưu.</span>}
        {isDirty && Object.keys(errors).length === 0 && <span className="text-xs text-gray-500 mr-auto">Có thay đổi chưa lưu.</span>}
        <button type="submit" disabled={isSubmitting} className={buttonClass.primary}>
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {mode === 'create' ? 'Tạo sản phẩm' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  );
}
