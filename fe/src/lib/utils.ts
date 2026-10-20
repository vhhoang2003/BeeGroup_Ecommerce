import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Locale, StockStatus } from '@/types/product';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * `3.380.000 ₫` in every locale (currency is always VND, README §10), or null when the price is not published so
 * the caller can show the localized "contact for price" label (CAT-07).
 */
export function formatPrice(amount: number | null): string | null {
  if (amount === null) return null;
  return `${amount.toLocaleString('vi-VN')} ₫`;
}

export const STOCK_STATUSES: StockStatus[] = ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'PRE_ORDER'];

const DATE_TAGS: Record<Locale, string> = { vi: 'vi-VN', en: 'en-GB', zh: 'zh-CN' };

export function formatDateTime(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(DATE_TAGS[locale], {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

const E164 = /^\+[1-9]\d{6,14}$/;

/**
 * Normalizes a phone number to the E.164 format the API expects: `0901 234 567` and `84901234567` become
 * `+84901234567`. Returns null when the input cannot be a valid number; an empty input returns ''.
 */
export function toE164(input: string): string | null {
  const compact = input.replace(/[\s.()-]/g, '');
  if (!compact) return '';
  let candidate = compact;
  if (compact.startsWith('00')) candidate = `+${compact.slice(2)}`;
  else if (compact.startsWith('0')) candidate = `+84${compact.slice(1)}`;
  else if (compact.startsWith('84')) candidate = `+${compact}`;
  return E164.test(candidate) ? candidate : null;
}

/** `+84901234567` -> `0901 234 567` for display; other countries stay in E.164. */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return '';
  const vn = /^\+84(\d{9})$/.exec(e164);
  if (!vn) return e164;
  const digits = `0${vn[1]}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

export type PasswordIssue = 'length' | 'letterDigit' | 'sameAsEmail';

/** Client-side mirror of the AUTH-03 policy; the BE also rejects common passwords. */
export function passwordIssue(password: string, email = ''): PasswordIssue | null {
  if (password.length < 8 || password.length > 72) return 'length';
  if (!/[A-Za-z\p{L}]/u.test(password) || !/\d/.test(password)) return 'letterDigit';
  if (email && password.trim().toLowerCase() === email.trim().toLowerCase()) return 'sameAsEmail';
  return null;
}

/** Absolute URLs come from the API's asset storage and are already resized WebP, so `next/image` skips them. */
export function isRemoteImage(url: string): boolean {
  return /^https?:\/\//.test(url);
}
