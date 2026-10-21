'use client';

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { optionalPhoneField } from '@/features/auth/schemas';
import { useAppLocale } from '@/features/catalog/hooks';
import { Alert, Button, Card, Field, inputClass } from '@/components/ui/form';
import { usePathname, useRouter } from '@/i18n/navigation';
import { LOCALE_LABELS, routing } from '@/i18n/routing';
import { MeApi } from '@/lib/api/endpoints';
import { applyFieldErrors, useErrorMessage } from '@/lib/api/errors';
import { formatDateTime, formatPhone, toE164 } from '@/lib/utils';
import { CONTACT_CHANNELS, type ContactChannel } from '@/types/user';
import type { Locale } from '@/types/product';

/** Profile (AUTH-14): name, phone, preferred language and contact channel. */
export default function ProfilePage() {
  const t = useTranslations('account');
  const tv = useTranslations('validation');
  const tc = useTranslations('channel');
  const errorMessage = useErrorMessage();
  const locale = useAppLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const schema = useMemo(
    () =>
      z.object({
        fullName: z.string().trim().min(1, tv('required')).max(100, tv('max', { max: 100 })),
        phone: optionalPhoneField(tv),
        preferredLocale: z.enum(['vi', 'en', 'zh']),
        preferredContact: z.enum(['PHONE', 'ZALO', 'EMAIL', 'MESSENGER', '']),
      }),
    [tv]
  );
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: user
      ? {
          fullName: user.fullName,
          phone: formatPhone(user.phone),
          preferredLocale: user.preferredLocale ?? locale,
          preferredContact: user.preferredContact ?? '',
        }
      : undefined,
  });

  if (!user) return null;

  const onSubmit = handleSubmit(async (values) => {
    setSaved(false);
    setError('');
    try {
      const updated = await MeApi.update({
        fullName: values.fullName.trim(),
        phone: toE164(values.phone) ?? '',
        preferredLocale: values.preferredLocale as Locale,
        preferredContact: (values.preferredContact || undefined) as ContactChannel | undefined,
      });
      setUser(updated);
      setSaved(true);
      // Show the site in the language the user just picked.
      if (updated.preferredLocale && updated.preferredLocale !== locale) {
        router.replace(pathname, { locale: updated.preferredLocale });
      }
    } catch (err) {
      if (!applyFieldErrors(err, setFieldError, ['fullName', 'phone'] as const, () => tv('invalid'))) {
        setError(errorMessage(err));
      }
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">{t('profile')}</h1>

      <Card>
        <form onSubmit={onSubmit} noValidate className="space-y-4 max-w-xl">
          {saved && <Alert tone="success">{t('profileSaved')}</Alert>}
          {error && <Alert>{error}</Alert>}

          <Field id="p-name" label={t('fullName')} error={errors.fullName?.message} required>
            {(a) => <input {...a} {...register('fullName')} autoComplete="name" className={inputClass} />}
          </Field>

          <Field id="p-email" label={t('email')} hint={t('emailHint')}>
            {(a) => <input {...a} value={user.email} disabled className={inputClass} />}
          </Field>

          <Field id="p-phone" label={t('phone')} error={errors.phone?.message} hint={t('phoneHint')}>
            {(a) => <input {...a} {...register('phone')} type="tel" autoComplete="tel" className={inputClass} />}
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="p-locale" label={t('preferredLocale')}>
              {(a) => (
                <select {...a} {...register('preferredLocale')} className={inputClass}>
                  {routing.locales.map((l) => (
                    <option key={l} value={l}>
                      {LOCALE_LABELS[l]}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field id="p-contact" label={t('preferredContact')}>
              {(a) => (
                <select {...a} {...register('preferredContact')} className={inputClass}>
                  <option value="">{t('noPreference')}</option>
                  {CONTACT_CHANNELS.map((c) => (
                    <option key={c} value={c}>
                      {tc(c)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            {t('save')}
          </Button>
        </form>
      </Card>

      <Card className="text-xs text-slate-500 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <p>
          <span className="block font-semibold text-slate-700">{t('memberSince')}</span>
          {formatDateTime(user.createdAt, locale)}
        </p>
        <p>
          <span className="block font-semibold text-slate-700">{t('emailVerifiedAt')}</span>
          {formatDateTime(user.emailVerifiedAt, locale)}
        </p>
        <p>
          <span className="block font-semibold text-slate-700">{t('lastLogin')}</span>
          {formatDateTime(user.lastLoginAt, locale)}
        </p>
      </Card>
    </div>
  );
}
