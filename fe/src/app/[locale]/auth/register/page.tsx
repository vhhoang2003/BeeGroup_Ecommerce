'use client';

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { MailCheck, UserPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import AuthCard from '@/features/auth/components/AuthCard';
import PasswordInput from '@/features/auth/components/PasswordInput';
import { emailField, optionalPhoneField, withPasswordRules } from '@/features/auth/schemas';
import { useAppLocale } from '@/features/catalog/hooks';
import { Alert, Button, Field, inputClass } from '@/components/ui/form';
import { ApiError } from '@/lib/api/client';
import { AuthApi } from '@/lib/api/endpoints';
import { applyFieldErrors, useErrorMessage } from '@/lib/api/errors';
import { toE164 } from '@/lib/utils';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const errorMessage = useErrorMessage();
  const locale = useAppLocale();
  const [error, setError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const schema = useMemo(
    () =>
      withPasswordRules(
        tv,
        {
          fullName: z.string().trim().min(1, tv('required')).max(100, tv('max', { max: 100 })),
          email: emailField(tv),
          phone: optionalPhoneField(tv),
          acceptTerms: z.boolean().refine((v) => v, tv('acceptTerms')),
        },
        { password: 'password', confirmation: 'passwordConfirmation' },
        (values) => String(values.email ?? '')
      ),
    [tv]
  );
  type FormValues = {
    fullName: string;
    email: string;
    phone: string;
    acceptTerms: boolean;
    password: string;
    passwordConfirmation: string;
  };

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { fullName: '', email: '', phone: '', acceptTerms: false, password: '', passwordConfirmation: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    try {
      await AuthApi.register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
        passwordConfirmation: values.passwordConfirmation,
        phone: toE164(values.phone) || undefined,
        acceptTerms: values.acceptTerms,
        locale,
      });
      setRegisteredEmail(values.email.trim());
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_ALREADY_EXISTS') {
        setFieldError('email', { type: 'server', message: errorMessage(err) });
        return;
      }
      const fields = ['fullName', 'email', 'phone', 'password', 'passwordConfirmation', 'acceptTerms'] as const;
      const applied = applyFieldErrors(err, setFieldError, fields, (field) =>
        field === 'password' ? tv('passwordWeak') : tv('invalid')
      );
      if (!applied) setError(errorMessage(err));
    }
  });

  const resend = async () => {
    if (!registeredEmail) return;
    try {
      await AuthApi.resendVerification(registeredEmail);
      setResent(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (registeredEmail) {
    return (
      <AuthCard icon={MailCheck} title={t('checkInboxTitle')} subtitle={t('checkInboxBody', { email: registeredEmail })}>
        {error && <Alert className="mb-4">{error}</Alert>}
        {resent ? (
          <Alert tone="success">{t('verificationResent')}</Alert>
        ) : (
          <p className="text-xs text-slate-500 text-center">
            {t('noEmail')}{' '}
            <button type="button" onClick={resend} className="font-semibold text-honey-700 hover:underline cursor-pointer">
              {t('resendVerification')}
            </button>
          </p>
        )}
        <Link href="/auth/login" className="block text-center mt-6 text-sm font-semibold text-honey-700 hover:underline">
          {t('goToLogin')}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      icon={UserPlus}
      title={t('registerTitle')}
      subtitle={t('registerSubtitle')}
      footer={
        <>
          {t('haveAccount')}{' '}
          <Link href="/auth/login" className="font-semibold text-honey-700 hover:underline">
            {t('signIn')}
          </Link>
        </>
      }
    >
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field id="reg-name" label={t('fullName')} error={errors.fullName?.message} required>
          {(a) => <input {...a} {...register('fullName')} autoComplete="name" className={inputClass} />}
        </Field>

        <Field id="reg-email" label={t('email')} error={errors.email?.message} required>
          {(a) => (
            <input {...a} {...register('email')} type="email" autoComplete="email" placeholder="name@example.com" className={inputClass} />
          )}
        </Field>

        <Field id="reg-phone" label={t('phoneOptional')} error={errors.phone?.message} hint={t('phoneHint')}>
          {(a) => <input {...a} {...register('phone')} type="tel" autoComplete="tel" className={inputClass} />}
        </Field>

        <Field id="reg-password" label={t('password')} error={errors.password?.message} hint={t('passwordHint')} required>
          {(a) => <PasswordInput {...a} {...register('password')} autoComplete="new-password" />}
        </Field>

        <Field
          id="reg-password2"
          label={t('passwordConfirmation')}
          error={errors.passwordConfirmation?.message}
          required
        >
          {(a) => <PasswordInput {...a} {...register('passwordConfirmation')} autoComplete="new-password" />}
        </Field>

        <div>
          <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              {...register('acceptTerms')}
              aria-invalid={!!errors.acceptTerms}
              className="accent-ink w-4 h-4 mt-0.5"
            />
            <span>
              {t.rich('acceptTerms', {
                terms: (chunks) => (
                  <Link href="/terms" target="_blank" className="font-semibold text-honey-700 hover:underline">
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link href="/privacy" target="_blank" className="font-semibold text-honey-700 hover:underline">
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="text-[11px] text-red-600 mt-1" role="alert">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full py-3">
          {isSubmitting ? t('registering') : t('createAccount')}
        </Button>
      </form>
    </AuthCard>
  );
}
