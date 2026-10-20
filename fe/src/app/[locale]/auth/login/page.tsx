'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { LogIn } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import AuthCard, { safeReturnUrl } from '@/features/auth/components/AuthCard';
import PasswordInput from '@/features/auth/components/PasswordInput';
import { emailField } from '@/features/auth/schemas';
import { Alert, Button, Field, inputClass } from '@/components/ui/form';
import { ApiError } from '@/lib/api/client';
import { AuthApi } from '@/lib/api/endpoints';
import { useErrorMessage } from '@/lib/api/errors';

function LoginForm() {
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, status, user } = useAuthStore();
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const returnUrl = safeReturnUrl(searchParams.get('returnUrl'), '/account');

  const schema = useMemo(
    () => z.object({ email: emailField(tv), password: z.string().min(1, tv('required')), rememberMe: z.boolean() }),
    [tv]
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  // Already signed in (e.g. after the session restore): skip the form.
  useEffect(() => {
    if (status === 'authenticated' && user) router.replace(returnUrl);
  }, [status, user, returnUrl, router]);

  const onSubmit = handleSubmit(async ({ email, password, rememberMe }) => {
    setError('');
    setUnverifiedEmail(null);
    setResent(false);
    try {
      const signedIn = await login(email, password, rememberMe);
      router.replace(signedIn.role === 'ADMIN' && returnUrl === '/account' ? '/admin' : returnUrl);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') setUnverifiedEmail(email);
      setError(errorMessage(err));
    }
  });

  const resend = async () => {
    if (!unverifiedEmail) return;
    try {
      await AuthApi.resendVerification(unverifiedEmail);
      setResent(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <AuthCard
      icon={LogIn}
      title={t('loginTitle')}
      subtitle={t('loginSubtitle')}
      footer={
        <>
          {t('noAccount')}{' '}
          <Link href="/auth/register" className="font-semibold text-[#008ECC] hover:underline">
            {t('registerNow')}
          </Link>
        </>
      }
    >
      {error && (
        <Alert className="mb-4">
          <p>{error}</p>
          {unverifiedEmail && !resent && (
            <button type="button" onClick={resend} className="font-semibold underline cursor-pointer">
              {t('resendVerification')}
            </button>
          )}
        </Alert>
      )}
      {resent && (
        <Alert tone="success" className="mb-4">
          {t('verificationResent')}
        </Alert>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field id="login-email" label={t('email')} error={errors.email?.message}>
          {(a) => (
            <input {...a} {...register('email')} type="email" autoComplete="email" placeholder="name@example.com" className={inputClass} />
          )}
        </Field>

        <Field
          id="login-password"
          label={t('password')}
          aside={
            <Link href="/auth/forgot-password" className="text-[#008ECC] hover:underline">
              {t('forgotPassword')}
            </Link>
          }
          error={errors.password?.message}
        >
          {(a) => <PasswordInput {...a} {...register('password')} autoComplete="current-password" />}
        </Field>

        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
          <input type="checkbox" {...register('rememberMe')} className="accent-[#008ECC] w-4 h-4" />
          {t('rememberMe')}
        </label>

        <Button type="submit" loading={isSubmitting} className="w-full py-3">
          {isSubmitting ? t('signingIn') : t('signIn')}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
