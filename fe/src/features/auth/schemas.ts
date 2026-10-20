import { z } from 'zod';
import { passwordIssue, toE164 } from '@/lib/utils';

/** Translator for the `validation` namespace (`useTranslations('validation')`). */
export type ValidationT = (key: string, values?: Record<string, string | number>) => string;

export const emailField = (tv: ValidationT) => z.string().trim().min(1, tv('required')).email(tv('email'));

/**
 * New password with the AUTH-03 rules and a matching confirmation. `emailOf` supplies the address the password
 * must differ from (the form's email field, or the logged-in user's).
 */
export function withPasswordRules<T extends z.ZodRawShape>(
  tv: ValidationT,
  shape: T,
  keys: { password: string; confirmation: string },
  emailOf: (values: Record<string, unknown>) => string
) {
  return z
    .object({
      ...shape,
      [keys.password]: z.string(),
      [keys.confirmation]: z.string(),
    })
    .superRefine((values, ctx) => {
      const record = values as Record<string, unknown>;
      const password = String(record[keys.password] ?? '');
      const issue = passwordIssue(password, emailOf(record));
      if (issue) ctx.addIssue({ code: 'custom', path: [keys.password], message: tv(`password_${issue}`) });
      if (password !== record[keys.confirmation]) {
        ctx.addIssue({ code: 'custom', path: [keys.confirmation], message: tv('passwordMismatch') });
      }
    });
}

/** Optional phone, accepted as `0901 234 567` or E.164. */
export const optionalPhoneField = (tv: ValidationT) =>
  z
    .string()
    .trim()
    .refine((v) => toE164(v) !== null, tv('phone'));
