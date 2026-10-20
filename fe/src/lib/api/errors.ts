'use client';

import { useTranslations } from 'next-intl';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from './client';

/** Error codes of README §8.2 that have a localized message under `errors.*`. */
const KNOWN_CODES = [
  'VALIDATION_ERROR',
  'TOKEN_INVALID_OR_EXPIRED',
  'CAPTCHA_FAILED',
  'INVALID_CREDENTIALS',
  'TOKEN_EXPIRED',
  'REFRESH_TOKEN_INVALID',
  'REFRESH_TOKEN_REUSED',
  'EMAIL_NOT_VERIFIED',
  'ACCESS_DENIED',
  'RESOURCE_NOT_FOUND',
  'EMAIL_ALREADY_EXISTS',
  'SLUG_ALREADY_EXISTS',
  'FILE_TOO_LARGE',
  'ACCOUNT_LOCKED',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;

/** Turns any thrown value into a message for the current locale. */
export function useErrorMessage() {
  const t = useTranslations('errors');
  return (error: unknown): string => {
    if (error instanceof ApiError) {
      const code = KNOWN_CODES.find((c) => c === error.code);
      if (code === 'RATE_LIMITED' || code === 'ACCOUNT_LOCKED') {
        const minutes = error.retryAfter ? Math.max(1, Math.ceil(error.retryAfter / 60)) : null;
        return minutes ? t(`${code}_retry`, { minutes }) : t(code);
      }
      if (code) return t(code);
      if (error.status === 0 || error.status >= 500) return t('INTERNAL_ERROR');
      return error.message;
    }
    return t('NETWORK');
  };
}

/**
 * Copies BE field errors (`error.fields`) onto react-hook-form fields that exist in the form; returns true when at
 * least one was applied so the caller can skip the generic banner.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  message: (field: string, raw: string) => string
): boolean {
  if (!(error instanceof ApiError) || error.fields.length === 0) return false;
  let applied = false;
  for (const f of error.fields) {
    const match = fields.find((name) => name === f.field);
    if (match) {
      setError(match, { type: 'server', message: message(f.field, f.message) });
      applied = true;
    }
  }
  return applied;
}
