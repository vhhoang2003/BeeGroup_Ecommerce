/**
 * Form model of the admin product editor: string-only values for the inputs, the zod rules that mirror the API's
 * `ProductRequest` validation (ADM-02), and the conversions between form values and the API DTOs.
 */
import { z } from 'zod';
import type { Locale, StockStatus } from '@/types/product';
import type { AdminProduct, LocalizedMap, ProductRequest, ProductStatus, TranslationInput } from '@/types/admin';

export const LOCALES: Locale[] = ['vi', 'en', 'zh'];

export const LOCALE_LABELS: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đang hiển thị',
  ARCHIVED: 'Lưu trữ',
};

export const STOCK_STATUSES: StockStatus[] = ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'PRE_ORDER'];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const localizedSchema = z.object({ vi: z.string(), en: z.string(), zh: z.string() });

const translationSchema = z.object({
  name: z.string().max(200, 'Tối đa 200 ký tự'),
  shortDescription: z.string().max(500, 'Tối đa 500 ký tự'),
  description: z.string(),
  /** One item per line. */
  highlights: z.string(),
  useCases: z.string(),
  notes: z.string(),
  metaTitle: z.string().max(200, 'Tối đa 200 ký tự'),
  metaDescription: z.string().max(500, 'Tối đa 500 ký tự'),
});

const specSchema = z.object({
  key: z.string().max(60, 'Tối đa 60 ký tự'),
  label: localizedSchema,
  value: localizedSchema,
});

export const productFormSchema = z
  .object({
    slug: z
      .string()
      .min(1, 'Bắt buộc')
      .max(120, 'Tối đa 120 ký tự')
      .regex(SLUG_PATTERN, 'Chỉ gồm chữ thường không dấu, số và dấu gạch ngang'),
    sku: z.string().max(50, 'Tối đa 50 ký tự'),
    brand: z.string().trim().min(1, 'Bắt buộc').max(60, 'Tối đa 60 ký tự'),
    categorySlug: z.string().min(1, 'Chọn danh mục'),
    subCategorySlug: z.string(),
    /** Digits only; dots, commas and spaces are accepted as thousand separators. Empty means "Liên hệ". */
    price: z.string().regex(/^[\d.,\s]*$/, 'Chỉ nhập số'),
    stockStatus: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'PRE_ORDER']),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    featured: z.boolean(),
    translations: z.object({ vi: translationSchema, en: translationSchema, zh: translationSchema }),
    specs: z.array(specSchema),
    /** One URL per line. */
    sources: z.string(),
  })
  .superRefine((values, ctx) => {
    for (const locale of LOCALES) {
      const t = values.translations[locale];
      // Vietnamese is required; another language is only sent once it has a name.
      const used = locale === 'vi' || Object.values(t).some((v) => v.trim() !== '');
      if (used && t.name.trim() === '') {
        ctx.addIssue({ code: 'custom', path: ['translations', locale, 'name'], message: 'Cần nhập tên sản phẩm' });
      }
    }
    values.specs.forEach((spec, i) => {
      if (isBlankSpec(spec)) return;
      if (spec.key.trim() === '') {
        ctx.addIssue({ code: 'custom', path: ['specs', i, 'key'], message: 'Bắt buộc' });
      }
      if (spec.label.vi.trim() === '') {
        ctx.addIssue({ code: 'custom', path: ['specs', i, 'label', 'vi'], message: 'Cần nhãn tiếng Việt' });
      }
      if (spec.value.vi.trim() === '') {
        ctx.addIssue({ code: 'custom', path: ['specs', i, 'value', 'vi'], message: 'Cần giá trị tiếng Việt' });
      }
    });
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;
type TranslationValues = ProductFormValues['translations']['vi'];
type SpecValues = ProductFormValues['specs'][number];

function emptyTranslation(): TranslationValues {
  return {
    name: '',
    shortDescription: '',
    description: '',
    highlights: '',
    useCases: '',
    notes: '',
    metaTitle: '',
    metaDescription: '',
  };
}

export function emptySpec(): SpecValues {
  return { key: '', label: { vi: '', en: '', zh: '' }, value: { vi: '', en: '', zh: '' } };
}

function isBlankSpec(spec: SpecValues): boolean {
  return [spec.key, ...Object.values(spec.label), ...Object.values(spec.value)].every((v) => v.trim() === '');
}

export function emptyProductForm(): ProductFormValues {
  return {
    slug: '',
    sku: '',
    brand: '',
    categorySlug: '',
    subCategorySlug: '',
    price: '',
    stockStatus: 'IN_STOCK',
    status: 'DRAFT',
    featured: false,
    translations: { vi: emptyTranslation(), en: emptyTranslation(), zh: emptyTranslation() },
    specs: [],
    sources: '',
  };
}

/** `"CPU AMD EPYC 7402 – 24 nhân"` → `"cpu-amd-epyc-7402-24-nhan"`. */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
    .replace(/-+$/, '');
}

const lines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const orNull = (text: string) => (text.trim() === '' ? null : text.trim());

function localized(map: LocalizedMap | undefined): SpecValues['label'] {
  return { vi: map?.vi ?? '', en: map?.en ?? '', zh: map?.zh ?? '' };
}

function compact(map: SpecValues['label']): LocalizedMap {
  const out: LocalizedMap = {};
  for (const locale of LOCALES) {
    if (map[locale].trim() !== '') out[locale] = map[locale].trim();
  }
  return out;
}

export function fromProduct(product: AdminProduct): ProductFormValues {
  const values = emptyProductForm();
  for (const locale of LOCALES) {
    const t = product.translations[locale];
    if (!t) continue;
    values.translations[locale] = {
      name: t.name ?? '',
      shortDescription: t.shortDescription ?? '',
      description: t.description ?? '',
      highlights: (t.highlights ?? []).join('\n'),
      useCases: (t.useCases ?? []).join('\n'),
      notes: (t.notes ?? []).join('\n'),
      metaTitle: t.metaTitle ?? '',
      metaDescription: t.metaDescription ?? '',
    };
  }
  return {
    ...values,
    slug: product.slug,
    sku: product.sku ?? '',
    brand: product.brand,
    categorySlug: product.categorySlug,
    subCategorySlug: product.subCategorySlug ?? '',
    price: product.price === null ? '' : String(product.price),
    stockStatus: product.stockStatus,
    status: product.status,
    featured: product.featured,
    specs: (product.specs ?? []).map((s) => ({ key: s.key, label: localized(s.label), value: localized(s.value) })),
    sources: (product.sources ?? []).join('\n'),
  };
}

export function toProductRequest(values: ProductFormValues): ProductRequest {
  const translations: ProductRequest['translations'] = {};
  for (const locale of LOCALES) {
    const t = values.translations[locale];
    if (t.name.trim() === '') continue;
    const input: TranslationInput = {
      name: t.name.trim(),
      shortDescription: orNull(t.shortDescription),
      description: orNull(t.description),
      highlights: lines(t.highlights),
      useCases: lines(t.useCases),
      notes: lines(t.notes),
      metaTitle: orNull(t.metaTitle),
      metaDescription: orNull(t.metaDescription),
    };
    translations[locale] = input;
  }

  const digits = values.price.replace(/\D/g, '');
  return {
    slug: values.slug.trim(),
    sku: orNull(values.sku),
    brand: values.brand.trim(),
    categorySlug: values.categorySlug,
    subCategorySlug: orNull(values.subCategorySlug),
    price: digits === '' ? null : Number(digits),
    stockStatus: values.stockStatus,
    status: values.status,
    featured: values.featured,
    translations,
    specs: values.specs
      .filter((spec) => !isBlankSpec(spec))
      .map((spec) => ({ key: spec.key.trim(), label: compact(spec.label), value: compact(spec.value) })),
    sources: lines(values.sources),
  };
}
