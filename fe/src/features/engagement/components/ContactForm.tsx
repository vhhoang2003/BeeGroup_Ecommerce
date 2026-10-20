'use client';

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useAppLocale } from '@/features/catalog/hooks';
import { optionalPhoneField } from '@/features/auth/schemas';
import { Alert, Button, Field, inputClass } from '@/components/ui/form';
import { InquiryApi } from '@/lib/api/endpoints';
import { applyFieldErrors, useErrorMessage } from '@/lib/api/errors';
import { formatPhone, toE164 } from '@/lib/utils';
import { CONTACT_CHANNELS } from '@/types/user';
import Turnstile, { captchaEnabled } from './Turnstile';

/** General contact form (ENG-04), stored by the API as a `GENERAL` inquiry. */
export default function ContactForm() {
  const t = useTranslations('contact');
  const tInq = useTranslations('inquiry');
  const tv = useTranslations('validation');
  const tc = useTranslations('channel');
  const errorMessage = useErrorMessage();
  const locale = useAppLocale();
  const user = useAuthStore((s) => s.user);
  const isGuest = !user;
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [formError, setFormError] = useState('');
  const [code, setCode] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        fullName: isGuest ? z.string().trim().min(1, tv('required')).max(100, tv('max', { max: 100 })) : z.string(),
        email: isGuest ? z.string().trim().email(tv('email')) : z.string(),
        phone: optionalPhoneField(tv),
        preferredContact: z.enum(['PHONE', 'ZALO', 'EMAIL', 'MESSENGER']),
        subject: z.string().trim().min(1, tv('required')).max(200, tv('max', { max: 200 })),
        message: z.string().trim().min(1, tv('required')).max(2000, tv('max', { max: 2000 })),
      }),
    [isGuest, tv]
  );
  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      phone: formatPhone(user?.phone),
      preferredContact: user?.preferredContact ?? 'EMAIL',
      subject: '',
      message: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError('');
    if (isGuest && captchaEnabled && !captcha) {
      setFormError(tInq('captchaRequired'));
      return;
    }
    try {
      const result = await InquiryApi.contact({
        fullName: isGuest ? values.fullName.trim() : undefined,
        email: isGuest ? values.email.trim() : undefined,
        phone: toE164(values.phone) || undefined,
        preferredContact: values.preferredContact,
        subject: values.subject.trim(),
        message: values.message.trim(),
        captchaToken: captcha ?? undefined,
        locale,
      });
      setCode(result.inquiryCode);
      reset();
    } catch (err) {
      const fields = ['fullName', 'email', 'phone', 'subject', 'message'] as const;
      if (!applyFieldErrors(err, setError, fields, () => tv('invalid'))) setFormError(errorMessage(err));
      setCaptcha(null);
      setCaptchaKey((k) => k + 1);
    }
  });

  if (code) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <p className="text-lg font-bold text-[#222222] mb-1">{t('sentTitle')}</p>
        <p className="text-sm text-gray-600 mb-1">{tInq('successCode', { code })}</p>
        <p className="text-sm text-gray-500 mb-6">{tInq('successBody')}</p>
        <Button variant="secondary" onClick={() => setCode(null)}>
          {t('sendAnother')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && <Alert>{formError}</Alert>}

      {isGuest && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="c-name" label={tInq('fullName')} error={errors.fullName?.message} required>
            {(a) => <input {...a} {...register('fullName')} autoComplete="name" className={inputClass} />}
          </Field>
          <Field id="c-email" label={tInq('email')} error={errors.email?.message} required>
            {(a) => <input {...a} {...register('email')} type="email" autoComplete="email" className={inputClass} />}
          </Field>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="c-phone" label={t('phoneOptional')} error={errors.phone?.message} hint={tInq('phoneHint')}>
          {(a) => <input {...a} {...register('phone')} type="tel" autoComplete="tel" className={inputClass} />}
        </Field>
        <Field id="c-channel" label={tInq('preferredContact')}>
          {(a) => (
            <select {...a} {...register('preferredContact')} className={inputClass}>
              {CONTACT_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {tc(c)}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field id="c-subject" label={t('subject')} error={errors.subject?.message} required>
        {(a) => <input {...a} {...register('subject')} className={inputClass} />}
      </Field>

      <Field id="c-message" label={t('message')} error={errors.message?.message} required>
        {(a) => <textarea {...a} {...register('message')} rows={6} className={inputClass} />}
      </Field>

      {isGuest && <Turnstile key={captchaKey} onToken={setCaptcha} />}

      <Button type="submit" loading={isSubmitting}>
        {t('send')}
      </Button>
      <p className="text-[11px] text-gray-500">{tInq('privacyNote')}</p>
    </form>
  );
}
