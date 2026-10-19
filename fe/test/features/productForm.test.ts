import { describe, it, expect } from 'vitest';
import {
  emptyProductForm,
  emptySpec,
  fromProduct,
  productFormSchema,
  slugify,
  toProductRequest,
} from '@/features/admin/productForm';
import type { AdminProduct } from '@/types/admin';

const product: AdminProduct = {
  id: 'p1',
  slug: 'amd-epyc-7402',
  sku: null,
  brand: 'AMD',
  categorySlug: 'cpu',
  subCategorySlug: 'epyc',
  price: 3380000,
  stockStatus: 'IN_STOCK',
  status: 'PUBLISHED',
  featured: true,
  translations: {
    vi: {
      name: 'AMD EPYC 7402',
      shortDescription: '24 nhân',
      description: 'Dòng 1\nDòng 2',
      highlights: ['PCIe 4.0', '128 MB L3'],
      useCases: [],
      notes: null,
      metaTitle: null,
      metaDescription: null,
    },
    zh: { name: 'AMD EPYC 7402 处理器' },
  },
  specs: [{ key: 'cores', label: { vi: 'Số nhân', zh: '核心' }, value: { vi: '24', zh: '24' } }],
  sources: ['https://amd.com/epyc'],
  images: [],
  viewCount: 0,
  publishedAt: null,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
};

function validForm() {
  const values = emptyProductForm();
  values.slug = 'gpu-tesla-p40';
  values.brand = 'NVIDIA';
  values.categorySlug = 'gpu';
  values.translations.vi.name = 'NVIDIA Tesla P40';
  return values;
}

describe('slugify', () => {
  it('strips Vietnamese diacritics and joins words with dashes', () => {
    expect(slugify('Tản nhiệt Đồng – EPYC SP3 (4U)')).toBe('tan-nhiet-dong-epyc-sp3-4u');
  });

  it('caps the length at 120 without a trailing dash', () => {
    const slug = slugify('a '.repeat(100));
    expect(slug.length).toBeLessThanOrEqual(120);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('fromProduct / toProductRequest', () => {
  it('round-trips a product without losing data in other languages', () => {
    const request = toProductRequest(fromProduct(product));
    expect(request.price).toBe(3380000);
    expect(request.sku).toBeNull();
    expect(request.subCategorySlug).toBe('epyc');
    expect(request.translations.vi?.highlights).toEqual(['PCIe 4.0', '128 MB L3']);
    expect(request.translations.vi?.description).toBe('Dòng 1\nDòng 2');
    expect(request.translations.zh?.name).toBe('AMD EPYC 7402 处理器');
    expect(request.translations.en).toBeUndefined();
    expect(request.specs).toEqual(product.specs);
    expect(request.sources).toEqual(['https://amd.com/epyc']);
  });

  it('reads an empty price as "contact us" and accepts thousand separators', () => {
    const values = validForm();
    expect(toProductRequest(values).price).toBeNull();
    values.price = '3.380.000';
    expect(toProductRequest(values).price).toBe(3380000);
  });

  it('drops blank spec rows and blank list lines', () => {
    const values = validForm();
    values.specs = [emptySpec()];
    values.translations.vi.notes = '  \nBảo hành 3 tháng\n\n';
    const request = toProductRequest(values);
    expect(request.specs).toEqual([]);
    expect(request.translations.vi?.notes).toEqual(['Bảo hành 3 tháng']);
  });
});

describe('productFormSchema', () => {
  it('accepts a minimal product', () => {
    expect(productFormSchema.safeParse(validForm()).success).toBe(true);
  });

  it('requires the Vietnamese name and a valid slug', () => {
    const values = validForm();
    values.translations.vi.name = ' ';
    values.slug = 'Not A Slug';
    const result = productFormSchema.safeParse(values);
    expect(result.success).toBe(false);
    const paths = result.error!.issues.map((i) => i.path.join('.'));
    expect(paths).toContain('translations.vi.name');
    expect(paths).toContain('slug');
  });

  it('requires a name once another language has content', () => {
    const values = validForm();
    values.translations.en.description = 'English description';
    const paths = productFormSchema.safeParse(values).error!.issues.map((i) => i.path.join('.'));
    expect(paths).toEqual(['translations.en.name']);
  });

  it('requires key, Vietnamese label and value on a used spec row', () => {
    const values = validForm();
    values.specs = [{ ...emptySpec(), value: { vi: '', en: '24 cores', zh: '' } }];
    const paths = productFormSchema.safeParse(values).error!.issues.map((i) => i.path.join('.'));
    expect(paths).toEqual(['specs.0.key', 'specs.0.label.vi', 'specs.0.value.vi']);
  });
});
