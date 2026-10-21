'use client';

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Alert, Button, Field, inputClass } from '@/components/ui/form';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useAppLocale } from '@/features/catalog/hooks';
import { InquiryApi } from '@/lib/api/endpoints';
import { applyFieldErrors, useErrorMessage } from '@/lib/api/errors';
import { formatPhone, formatPrice, toE164 } from '@/lib/utils';
import { CONTACT_CHANNELS } from '@/types/user';
import type { ProductSummary } from '@/types/product';
import Turnstile, { captchaEnabled } from './Turnstile';

interface InquiryDialogProps {
  product: Pick<ProductSummary, 'id' | 'name' | 'price'>;
  open: boolean;
  onClose: () => void;
}

/**
 * Quote request (ENG-01 / ENG-02, README §6.6). Logged-in users only add quantity, message and how to reach them;
 * guests also give name, email and phone and pass the captcha.
 */
export default function InquiryDialog({ product, open, onClose }: InquiryDialogProps) {
  const t = useTranslations('inquiry');
  const tv = useTranslations('validation');
  const tc = useTranslations('channel');
  const tCommon = useTranslations('common');
  const errorMessage = useErrorMessage();
  const locale = useAppLocale();
  const user = useAuthStore((s) => s.user);
  const isGuest = !user;

  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [formError, setFormError] = useState('');
  const [inquiryCode, setInquiryCode] = useState<string | null>(null);

  const schema = useMemo(() => {
    const phone = z
      .string()
      .trim()
      .refine((v) => toE164(v) !== null, tv('phone'));
    return z.object({
      quantity: z.coerce.number({ invalid_type_error: tv('quantity') }).int(tv('quantity')).min(1, tv('quantity')).max(100000, tv('quantity')),
      message: z.string().max(2000, tv('max', { max: 2000 })),
      preferredContact: z.enum(['PHONE', 'ZALO', 'EMAIL', 'MESSENGER']),
      // Required for guests and for members whose profile has no phone; the BE returns phone if it is missing.
      phone: isGuest || !user?.phone ? phone.refine((v) => v !== '', tv('required')) : phone,
      fullName: isGuest ? z.string().trim().min(1, tv('required')).max(100, tv('max', { max: 100 })) : z.string(),
      email: isGuest ? z.string().trim().email(tv('email')) : z.string(),
    });
  }, [isGuest, user?.phone, tv]);

  type FormValues = z.input<typeof schema>;

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      quantity: 1,
      message: '',
      preferredContact: user?.preferredContact ?? 'ZALO',
      phone: formatPhone(user?.phone),
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
    },
  });

  const close = () => {
    onClose();
    setFormError('');
    setInquiryCode(null);
    reset();
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError('');
    if (isGuest && captchaEnabled && !captcha) {
      setFormError(t('captchaRequired'));
      return;
    }
    const phone = toE164(String(values.phone)) || undefined;
    try {
      const result = await InquiryApi.create({
        productId: product.id,
        quantity: Number(values.quantity),
        message: String(values.message).trim() || undefined,
        preferredContact: values.preferredContact,
        phone,
        fullName: isGuest ? String(values.fullName).trim() : undefined,
        email: isGuest ? String(values.email).trim() : undefined,
        captchaToken: captcha ?? undefined,
        locale,
      });
      setInquiryCode(result.inquiryCode);
    } catch (err) {
      const fields = ['quantity', 'message', 'phone', 'fullName', 'email'] as const;
      if (!applyFieldErrors(err, setError, fields, () => tv('invalid'))) setFormError(errorMessage(err));
      setCaptcha(null);
      setCaptchaKey((k) => k + 1);
    }
  });

  return (
    <Modal open={open} onClose={close} title={t('title')} closeLabel={tCommon('close')}>
      {inquiryCode ? (
        <div className="text-center py-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-base font-bold text-ink mb-1">{t('successTitle')}</p>
          <p className="text-sm text-slate-600 mb-1">{t('successCode', { code: inquiryCode })}</p>
          <p className="text-sm text-slate-500 mb-6">{t('successBody')}</p>
          <Button onClick={close}>{tCommon('close')}</Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="rounded-xl bg-paper border border-honey-200 p-3 text-sm">
            <p className="font-semibold text-ink">{product.name}</p>
            <p className="text-slate-500">{formatPrice(product.price) ?? tCommon('contactForPrice')}</p>
          </div>

          {formError && <Alert>{formError}</Alert>}

          {isGuest && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="inq-name" label={t('fullName')} error={errors.fullName?.message} required>
                {(a) => <input {...a} {...register('fullName')} autoComplete="name" className={inputClass} />}
              </Field>
              <Field id="inq-email" label={t('email')} error={errors.email?.message} required>
                {(a) => <input {...a} {...register('email')} type="email" autoComplete="email" className={inputClass} />}
              </Field>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="inq-qty" label={t('quantity')} error={errors.quantity?.message} required>
              {(a) => <input {...a} {...register('quantity')} type="number" min={1} inputMode="numeric" className={inputClass} />}
            </Field>
            <Field
              id="inq-phone"
              label={t('phone')}
              error={errors.phone?.message}
              required={isGuest || !user?.phone}
              hint={t('phoneHint')}
            >
              {(a) => <input {...a} {...register('phone')} type="tel" autoComplete="tel" className={inputClass} />}
            </Field>
          </div>

          <Field id="inq-channel" label={t('preferredContact')}>
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

          <Field id="inq-message" label={t('message')} error={errors.message?.message}>
            {(a) => (
              <textarea {...a} {...register('message')} rows={4} placeholder={t('messagePlaceholder')} className={inputClass} />
            )}
          </Field>

          {isGuest && <Turnstile key={captchaKey} onToken={setCaptcha} />}

          <Button type="submit" loading={isSubmitting} className="w-full">
            {t('submit')}
          </Button>
          <p className="text-[11px] text-slate-500 text-center">{t('privacyNote')}</p>
        </form>
      )}
    </Modal>
  );
}
