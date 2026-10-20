/** Mapping between the admin product form state and the API's `ProductRequest` / `AdminProduct`. */
import { routing } from '@/i18n/routing';
import type { AdminProduct, LocalizedText, ProductRequest, ProductStatus } from '@/types/admin';
import type { Locale, StockStatus } from '@/types/product';

export interface TranslationForm {
  name: string;
  shortDescription: string;
  description: string;
  /** One item per line. */
  highlights: string;
  useCases: string;
  notes: string;
  metaTitle: string;
  metaDescription: string;
}

export interface SpecForm {
  key: string;
  label: Record<Locale, string>;
  value: Record<Locale, string>;
}

export interface ProductFormValues {
  slug: string;
  sku: string;
  brand: string;
  categorySlug: string;
  subCategorySlug: string;
  /** Digits only; empty means "contact for price". */
  price: string;
  stockStatus: StockStatus;
  status: ProductStatus;
  featured: boolean;
  translations: Record<Locale, TranslationForm>;
  specs: SpecForm[];
  /** One URL per line. */
  sources: string;
}

const emptyTranslation = (): TranslationForm => ({
  name: '',
  shortDescription: '',
  description: '',
  highlights: '',
  useCases: '',
  notes: '',
  metaTitle: '',
  metaDescription: '',
});

const perLocale = <T,>(make: (l: Locale) => T): Record<Locale, T> =>
  Object.fromEntries(routing.locales.map((l) => [l, make(l)])) as Record<Locale, T>;

export const emptySpec = (): SpecForm => ({ key: '', label: perLocale(() => ''), value: perLocale(() => '') });

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
    translations: perLocale(emptyTranslation),
    specs: [],
    sources: '',
  };
}

const lines = (text: string): string[] =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

const joinLines = (items: string[] | null | undefined) => (items ?? []).join('\n');

function compact(map: Record<Locale, string>): LocalizedText {
  const out: LocalizedText = {};
  for (const [locale, value] of Object.entries(map) as [Locale, string][]) {
    if (value.trim()) out[locale] = value.trim();
  }
  return out;
}

export function fromProduct(p: AdminProduct): ProductFormValues {
  return {
    slug: p.slug,
    sku: p.sku ?? '',
    brand: p.brand,
    categorySlug: p.categorySlug,
    subCategorySlug: p.subCategorySlug ?? '',
    price: p.price === null ? '' : String(p.price),
    stockStatus: p.stockStatus,
    status: p.status,
    featured: p.featured,
    translations: perLocale((l) => {
      const tr = p.translations[l];
      return tr
        ? {
            name: tr.name ?? '',
            shortDescription: tr.shortDescription ?? '',
            description: tr.description ?? '',
            highlights: joinLines(tr.highlights),
            useCases: joinLines(tr.useCases),
            notes: joinLines(tr.notes),
            metaTitle: tr.metaTitle ?? '',
            metaDescription: tr.metaDescription ?? '',
          }
        : emptyTranslation();
    }),
    specs: (p.specs ?? []).map((s) => ({
      key: s.key,
      label: perLocale((l) => s.label[l] ?? ''),
      value: perLocale((l) => s.value[l] ?? ''),
    })),
    sources: joinLines(p.sources),
  };
}

/** Locales without a name are left out; the API requires at least `vi`. */
export function toRequest(v: ProductFormValues): ProductRequest {
  const translations: ProductRequest['translations'] = {};
  for (const locale of routing.locales) {
    const tr = v.translations[locale];
    if (!tr.name.trim()) continue;
    translations[locale] = {
      name: tr.name.trim(),
      shortDescription: tr.shortDescription.trim() || null,
      description: tr.description.trim() || null,
      highlights: lines(tr.highlights),
      useCases: lines(tr.useCases),
      notes: lines(tr.notes),
      metaTitle: tr.metaTitle.trim() || null,
      metaDescription: tr.metaDescription.trim() || null,
    };
  }
  return {
    slug: v.slug.trim(),
    sku: v.sku.trim() || null,
    brand: v.brand.trim(),
    categorySlug: v.categorySlug,
    subCategorySlug: v.subCategorySlug || null,
    price: v.price.trim() === '' ? null : Number(v.price),
    stockStatus: v.stockStatus,
    status: v.status,
    featured: v.featured,
    translations,
    specs: v.specs
      .filter((s) => s.key.trim())
      .map((s) => ({ key: s.key.trim(), label: compact(s.label), value: compact(s.value) })),
    sources: lines(v.sources),
  };
}

/** `AMD EPYC 7402` -> `amd-epyc-7402` (the API's slug pattern). */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
