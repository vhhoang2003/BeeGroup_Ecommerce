'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { KeyRound } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import AuthCard from '@/features/auth/components/AuthCard';
import PasswordInput from '@/features/auth/components/PasswordInput';
import { withPasswordRules } from '@/features/auth/schemas';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { Alert, Button, Field } from '@/components/ui/form';
import { ApiError } from '@/lib/api/client';
import { AuthApi } from '@/lib/api/endpoints';
import { useErrorMessage } from '@/lib/api/errors';

/** AUTH-12: new password from the emailed link; every session is revoked, so the user logs in again. */
function ResetPassword() {
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const errorMessage = useErrorMessage();
  const token = useSearchParams().get('token');
  const clear = useAuthStore((s) => s.clear);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(token ? '' : t('missingToken'));
  const [linkInvalid, setLinkInvalid] = useState(!token);

  const schema = useMemo(
    () => withPasswordRules(tv, {}, { password: 'newPassword', confirmation: 'confirmation' }, () => ''),
    [tv]
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ newPassword: string; confirmation: string }>({
    resolver: zodResolver(schema) as never,
    defaultValues: { newPassword: '', confirmation: '' },
  });

  const onSubmit = handleSubmit(async ({ newPassword }) => {
    if (!token) return;
    setError('');
    try {
      await AuthApi.resetPassword(token, newPassword);
      clear();
      setDone(true);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setLinkInvalid(code === 'TOKEN_INVALID_OR_EXPIRED');
      setError(code === 'VALIDATION_ERROR' ? tv('passwordWeak') : errorMessage(err));
    }
  });

  if (done) {
    return (
      <AuthCard icon={KeyRound} title={t('resetDoneTitle')} subtitle={t('resetDoneBody')}>
        <Link
          href="/auth/login"
          className="block text-center bg-[#008ECC] hover:bg-[#0077b0] text-white py-3 rounded-xl font-bold text-sm"
        >
          {t('goToLogin')}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard icon={KeyRound} title={t('resetTitle')} subtitle={t('resetSubtitle')}>
      {error && (
        <Alert className="mb-4">
          <p>{error}</p>
          {linkInvalid && (
            <Link href="/auth/forgot-password" className="font-semibold underline">
              {t('requestNewLink')}
            </Link>
          )}
        </Alert>
      )}
      {token && (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Field id="reset-password" label={t('newPassword')} error={errors.newPassword?.message} hint={t('passwordHint')}>
            {(a) => <PasswordInput {...a} {...register('newPassword')} autoComplete="new-password" />}
          </Field>
          <Field id="reset-confirmation" label={t('passwordConfirmation')} error={errors.confirmation?.message}>
            {(a) => <PasswordInput {...a} {...register('confirmation')} autoComplete="new-password" />}
          </Field>
          <Button type="submit" loading={isSubmitting} className="w-full py-3">
            {t('setNewPassword')}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPassword />
    </Suspense>
  );
}
