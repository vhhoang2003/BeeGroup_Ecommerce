'use client';

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { KeyRound } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import AuthCard from '@/features/auth/components/AuthCard';
import { emailField } from '@/features/auth/schemas';
import { Alert, Button, Field, inputClass } from '@/components/ui/form';
import { AuthApi } from '@/lib/api/endpoints';
import { useErrorMessage } from '@/lib/api/errors';

/** AUTH-11: the answer is the same whether or not the account exists. */
export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const errorMessage = useErrorMessage();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const schema = useMemo(() => z.object({ email: emailField(tv) }), [tv]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  const onSubmit = handleSubmit(async ({ email }) => {
    setError('');
    try {
      await AuthApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  });

  return (
    <AuthCard
      icon={KeyRound}
      title={t('forgotTitle')}
      subtitle={t('forgotSubtitle')}
      footer={
        <Link href="/auth/login" className="font-semibold text-[#008ECC] hover:underline">
          {t('backToLogin')}
        </Link>
      }
    >
      {sent ? (
        <Alert tone="success">{t('forgotSent')}</Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <Field id="forgot-email" label={t('email')} error={errors.email?.message}>
            {(a) => <input {...a} {...register('email')} type="email" autoComplete="email" className={inputClass} />}
          </Field>
          <Button type="submit" loading={isSubmitting} className="w-full py-3">
            {t('sendResetLink')}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
