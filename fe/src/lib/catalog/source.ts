/**
 * Server-only catalog reader for local development.
 *
 * Reads the curated `product/` folder (README §1.4) and exposes it in the same DTO shapes the
 * Spring Boot API will return. The folder doubles as a temporary object storage: image files are
 * served by `app/storage/[...key]/route.ts` under `STORAGE_BASE_URL`, keyed by their relative path.
 * Only import this from route handlers.
 */
import { promises as fs } from 'fs';
import path from 'path';
import type { Category } from '@/types/category';
import type {
  Locale,
  ProductDetail,
  ProductFilterParams,
  ProductImage,
  ProductSummary,
  SpecRow,
  StockStatus,
} from '@/types/product';
import type { PaginatedResponse } from '@/types/api';

export const CATALOG_DIR = path.resolve(process.cwd(), process.env.CATALOG_SOURCE_DIR || '../product');
export const STORAGE_BASE_URL = '/storage';

const DEFAULT_LOCALE: Locale = 'vi';
const LOCALES: Locale[] = ['vi', 'en', 'zh'];
const CATEGORY_ORDER = ['cpu', 'gpu', 'mainboard', 'cooler'];

type Localized = Partial<Record<Locale, string>>;

interface RawLocaleContent {
  name?: string;
  shortDescription?: string;
  description?: string;
  highlights?: string[];
  useCases?: string[];
  notes?: string[];
}

interface RawProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  categorySlug: string;
  subCategory?: string;
  price: number | null;
  stockStatus?: StockStatus;
  featured?: boolean;
  image?: string;
  images?: string[];
  description?: string;
  features?: string[];
  specsDetailed?: { key: string; label: Localized; value: Localized }[];
  i18n?: Partial<Record<Locale, RawLocaleContent>>;
  sources?: string[];
}

interface RawCategory {
  name: string;
  slug: string;
  subCategories: { name: string; slug: string; products: string[] }[];
}

interface CatalogEntry {
  raw: RawProduct;
  category: { slug: string; name: string };
  subCategory: { slug: string; name: string } | null;
  /** Storage keys, e.g. `CPU/Epyc 7402/images/01-top.jpg`; first one is the primary image. */
  imageKeys: string[];
  imageCredits: string | null;
}

interface Catalog {
  categories: { slug: string; name: string; subCategories: RawCategory['subCategories'] }[];
  entries: CatalogEntry[];
}

let cached: Catalog | null = null;

async function readJson<T>(file: string): Promise<T> {
  // Strip a UTF-8 BOM so files saved by Windows editors still parse.
  return JSON.parse((await fs.readFile(file, 'utf8')).replace(/^﻿/, '')) as T;
}

async function exists(file: string): Promise<boolean> {
  return fs.access(file).then(
    () => true,
    () => false
  );
}

async function loadCatalog(): Promise<Catalog> {
  if (cached && process.env.NODE_ENV === 'production') return cached;

  const categories: Catalog['categories'] = [];
  const entries: CatalogEntry[] = [];

  for (const dirent of await fs.readdir(CATALOG_DIR, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;
    const categoryDir = path.join(CATALOG_DIR, dirent.name);
    const categoryFile = path.join(categoryDir, 'category.json');
    if (!(await exists(categoryFile))) continue;

    const rawCategory = await readJson<RawCategory>(categoryFile);
    categories.push({ slug: rawCategory.slug, name: rawCategory.name, subCategories: rawCategory.subCategories });

    for (const sub of rawCategory.subCategories) {
      for (const productFolder of sub.products) {
        const productDir = path.join(categoryDir, productFolder);
        const productFile = path.join(productDir, 'info', 'product.json');
        if (!(await exists(productFile))) continue;

        const raw = await readJson<RawProduct>(productFile);
        const declared = raw.images?.length ? raw.images : raw.image ? [raw.image] : [];
        const imageKeys: string[] = [];
        for (const rel of declared) {
          if (await exists(path.join(productDir, rel))) {
            imageKeys.push([dirent.name, productFolder, ...rel.split('/')].join('/'));
          }
        }

        const creditsFile = path.join(productDir, 'images', 'CREDITS.txt');
        const imageCredits = (await exists(creditsFile))
          ? (await fs.readFile(creditsFile, 'utf8')).trim()
          : null;

        entries.push({
          raw,
          category: { slug: rawCategory.slug, name: rawCategory.name },
          subCategory: { slug: sub.slug, name: sub.name },
          imageKeys,
          imageCredits,
        });
      }
    }
  }

  const rank = (slug: string) => {
    const i = CATEGORY_ORDER.indexOf(slug);
    return i === -1 ? CATEGORY_ORDER.length : i;
  };
  categories.sort((a, b) => rank(a.slug) - rank(b.slug));
  entries.sort(
    (a, b) => rank(a.category.slug) - rank(b.category.slug) || Number(a.raw.id) - Number(b.raw.id)
  );

  cached = { categories, entries };
  return cached;
}

export function storageUrl(key: string): string {
  return `${STORAGE_BASE_URL}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function pick(value: Localized | undefined, locale: Locale): string {
  if (!value) return '';
  return value[locale] ?? value[DEFAULT_LOCALE] ?? value.en ?? '';
}

function content(raw: RawProduct, locale: Locale): RawLocaleContent {
  return { ...raw.i18n?.[DEFAULT_LOCALE], ...raw.i18n?.[locale] };
}

function toImages(entry: CatalogEntry, name: string): ProductImage[] {
  return entry.imageKeys.map((key, i) => ({
    url: storageUrl(key),
    alt: i === 0 ? name : `${name} (${i + 1})`,
  }));
}

function toSummary(entry: CatalogEntry, locale: Locale): ProductSummary {
  const { raw } = entry;
  const text = content(raw, locale);
  const name = text.name || raw.name;
  return {
    id: raw.id,
    slug: raw.slug,
    name,
    brand: raw.brand,
    category: entry.category,
    subCategory: entry.subCategory,
    price: raw.price ?? null,
    stockStatus: raw.stockStatus ?? 'IN_STOCK',
    featured: raw.featured ?? false,
    shortDescription: text.shortDescription ?? '',
    image: toImages(entry, name)[0] ?? null,
  };
}

function toDetail(entry: CatalogEntry, locale: Locale): ProductDetail {
  const { raw } = entry;
  const text = content(raw, locale);
  const summary = toSummary(entry, locale);
  const specs: SpecRow[] = (raw.specsDetailed ?? []).map((row) => ({
    key: row.key,
    label: pick(row.label, locale),
    value: pick(row.value, locale),
  }));
  return {
    ...summary,
    description: text.description ?? raw.description ?? '',
    highlights: text.highlights ?? raw.features ?? [],
    useCases: text.useCases ?? [],
    notes: text.notes ?? [],
    specs,
    images: toImages(entry, summary.name),
    sources: raw.sources ?? [],
    imageCredits: entry.imageCredits,
  };
}

/** Lowercased text a search query is matched against: names, brand, highlights and spec values in every locale. */
function haystack(entry: CatalogEntry): string {
  const { raw } = entry;
  const parts: string[] = [raw.name, raw.brand, raw.slug, entry.category.name, entry.subCategory?.name ?? ''];
  for (const locale of LOCALES) {
    const text = raw.i18n?.[locale];
    if (text) parts.push(text.name ?? '', text.shortDescription ?? '', ...(text.highlights ?? []));
  }
  for (const row of raw.specsDetailed ?? []) parts.push(...Object.values(row.value));
  return parts.join(' ').toLowerCase();
}

function matchesQuery(entry: CatalogEntry, q: string): boolean {
  const text = haystack(entry);
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => text.includes(token));
}

export function parseLocale(value: string | null): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}

export async function listCategories(): Promise<Category[]> {
  const { categories, entries } = await loadCatalog();
  return categories.map((c) => {
    const inCategory = entries.filter((e) => e.category.slug === c.slug);
    const withImage = inCategory.find((e) => e.imageKeys.length > 0);
    return {
      id: c.slug,
      slug: c.slug,
      name: c.name,
      image: withImage ? storageUrl(withImage.imageKeys[0]) : null,
      itemCount: inCategory.length,
      subCategories: c.subCategories.map((s) => ({
        slug: s.slug,
        name: s.name,
        itemCount: inCategory.filter((e) => e.subCategory?.slug === s.slug).length,
      })),
    };
  });
}

export async function getCategory(slug: string): Promise<Category | null> {
  return (await listCategories()).find((c) => c.slug === slug) ?? null;
}

export async function listProducts(
  params: ProductFilterParams,
  locale: Locale
): Promise<PaginatedResponse<ProductSummary>> {
  const { entries } = await loadCatalog();
  let items = entries;

  if (params.category) items = items.filter((e) => e.category.slug === params.category);
  if (params.sub) items = items.filter((e) => e.subCategory?.slug === params.sub);
  if (params.brand) items = items.filter((e) => e.raw.brand.toLowerCase() === params.brand!.toLowerCase());
  if (params.stock) items = items.filter((e) => (e.raw.stockStatus ?? 'IN_STOCK') === params.stock);
  if (params.minPrice !== undefined) items = items.filter((e) => (e.raw.price ?? 0) >= params.minPrice!);
  if (params.maxPrice !== undefined) items = items.filter((e) => (e.raw.price ?? Infinity) <= params.maxPrice!);
  if (params.q?.trim()) items = items.filter((e) => matchesQuery(e, params.q!));

  // Products without a price ("contact for price") always sort last.
  const price = (e: CatalogEntry, missing: number) => e.raw.price ?? missing;
  items = [...items];
  switch (params.sort) {
    case 'price-asc':
      items.sort((a, b) => price(a, Infinity) - price(b, Infinity));
      break;
    case 'price-desc':
      items.sort((a, b) => price(b, -Infinity) - price(a, -Infinity));
      break;
    case 'newest':
      items.sort((a, b) => Number(b.raw.id) - Number(a.raw.id));
      break;
    default:
      items.sort((a, b) => Number(b.raw.featured ?? false) - Number(a.raw.featured ?? false));
  }

  const size = Math.min(Math.max(params.size ?? 12, 1), 48);
  const page = Math.max(params.page ?? 0, 0);
  const start = page * size;
  return {
    content: items.slice(start, start + size).map((e) => toSummary(e, locale)),
    pageNumber: page,
    pageSize: size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
    last: start + size >= items.length,
  };
}

/**
 * Products flagged `"featured": true` in `product.json`. Until any are flagged,
 * falls back to products that have photos so the home page is never empty.
 */
export async function listFeatured(locale: Locale, limit = 8): Promise<ProductSummary[]> {
  const { entries } = await loadCatalog();
  const flagged = entries.filter((e) => e.raw.featured);
  const pool = flagged.length ? flagged : entries.filter((e) => e.imageKeys.length > 0);
  return pool.slice(0, limit).map((e) => toSummary(e, locale));
}

export async function getProduct(slug: string, locale: Locale): Promise<ProductDetail | null> {
  const { entries } = await loadCatalog();
  const entry = entries.find((e) => e.raw.slug === slug || e.raw.id === slug);
  return entry ? toDetail(entry, locale) : null;
}

/** Same sub-category first, then same category (CAT-09). */
export async function listRelated(slug: string, locale: Locale, limit = 4): Promise<ProductSummary[]> {
  const { entries } = await loadCatalog();
  const current = entries.find((e) => e.raw.slug === slug);
  if (!current) return [];
  const others = entries.filter((e) => e !== current && e.category.slug === current.category.slug);
  const sameSub = others.filter((e) => e.subCategory?.slug === current.subCategory?.slug);
  const rest = others.filter((e) => !sameSub.includes(e));
  return [...sameSub, ...rest].slice(0, limit).map((e) => toSummary(e, locale));
}

export async function suggest(q: string, locale: Locale, limit = 8): Promise<ProductSummary[]> {
  if (!q.trim()) return [];
  const { entries } = await loadCatalog();
  return entries
    .filter((e) => matchesQuery(e, q))
    .slice(0, limit)
    .map((e) => toSummary(e, locale));
}
