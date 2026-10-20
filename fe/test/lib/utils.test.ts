import { describe, expect, it } from 'vitest';
import { formatPhone, formatPrice, passwordIssue, toE164 } from '@/lib/utils';
import { safeReturnUrl } from '@/features/auth/components/AuthCard';
import { slugify, toRequest, emptyProductForm } from '@/features/admin/productForm';

describe('toE164', () => {
  it.each([
    ['0901 234 567', '+84901234567'],
    ['090.123.4567', '+84901234567'],
    ['84901234567', '+84901234567'],
    ['+86 138 0013 8000', '+8613800138000'],
    ['0086 13800138000', '+8613800138000'],
    ['', ''],
  ])('%s -> %s', (input, expected) => {
    expect(toE164(input)).toBe(expected);
  });

  it('rejects text and too-short numbers', () => {
    expect(toE164('abc')).toBeNull();
    expect(toE164('012')).toBeNull();
  });

  it('formats Vietnamese numbers back for display', () => {
    expect(formatPhone('+84901234567')).toBe('0901 234 567');
    expect(formatPhone('+8613800138000')).toBe('+8613800138000');
  });
});

describe('passwordIssue (AUTH-03)', () => {
  it('accepts 8-72 characters with a letter and a digit', () => {
    expect(passwordIssue('Beestore2026')).toBeNull();
  });
  it('flags length, missing letter / digit and the email itself', () => {
    expect(passwordIssue('a1b2c3')).toBe('length');
    expect(passwordIssue('x'.repeat(73) + '1')).toBe('length');
    expect(passwordIssue('12345678')).toBe('letterDigit');
    expect(passwordIssue('onlyletters')).toBe('letterDigit');
    expect(passwordIssue('khach1@example.com', 'Khach1@Example.com')).toBe('sameAsEmail');
  });
});

describe('formatPrice (CAT-07)', () => {
  it('uses VND with dot separators, null for "contact for price"', () => {
    expect(formatPrice(3380000)).toBe('3.380.000 ₫');
    expect(formatPrice(null)).toBeNull();
  });
});

describe('safeReturnUrl', () => {
  it('only allows same-site relative paths', () => {
    expect(safeReturnUrl('/account/wishlist', '/account')).toBe('/account/wishlist');
    expect(safeReturnUrl('//evil.example', '/account')).toBe('/account');
    expect(safeReturnUrl('https://evil.example', '/account')).toBe('/account');
    expect(safeReturnUrl('/\\evil.example', '/account')).toBe('/account');
    expect(safeReturnUrl(null, '/account')).toBe('/account');
  });
});

describe('admin product form mapping', () => {
  it('slugifies Vietnamese names', () => {
    expect(slugify('Tản nhiệt AIO 360 – Đen')).toBe('tan-nhiet-aio-360-den');
  });

  it('drops locales without a name, splits lines and keeps null price', () => {
    const form = emptyProductForm();
    form.slug = 'amd-epyc-7402';
    form.brand = 'AMD';
    form.categorySlug = 'cpu';
    form.translations.vi = { ...form.translations.vi, name: 'AMD EPYC 7402', highlights: '24 nhân\n\n 128 lane PCIe 4.0 ' };
    form.specs = [
      { key: 'cores', label: { vi: 'Số nhân', en: 'Cores', zh: '' }, value: { vi: '24', en: '24', zh: '' } },
      { key: '  ', label: { vi: '', en: '', zh: '' }, value: { vi: '', en: '', zh: '' } },
    ];

    const request = toRequest(form);

    expect(Object.keys(request.translations)).toEqual(['vi']);
    expect(request.translations.vi?.highlights).toEqual(['24 nhân', '128 lane PCIe 4.0']);
    expect(request.price).toBeNull();
    expect(request.subCategorySlug).toBeNull();
    expect(request.specs).toEqual([{ key: 'cores', label: { vi: 'Số nhân', en: 'Cores' }, value: { vi: '24', en: '24' } }]);
  });
});
