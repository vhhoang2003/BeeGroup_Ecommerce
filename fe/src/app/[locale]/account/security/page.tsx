'use client';

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import PasswordInput from '@/features/auth/components/PasswordInput';
import { emailField, withPasswordRules } from '@/features/auth/schemas';
import { Alert, Button, Card, Field, inputClass } from '@/components/ui/form';
import { useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { MeApi } from '@/lib/api/endpoints';
import { useErrorMessage } from '@/lib/api/errors';

/** Field names of a VALIDATION_ERROR; the BE reports a wrong current password this way too. */
function errorFields(err: unknown): string[] {
  return err instanceof ApiError && err.code === 'VALIDATION_ERROR' ? err.fields.map((f) => f.field) : [];
}

/** Change password (AUTH-13), change email (AUTH-14), sign out everywhere (AUTH-10), delete account (AUTH-15). */
export default function SecurityPage() {
  const t = useTranslations('account');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222]">{t('security')}</h1>
      <ChangePassword />
      <ChangeEmail />
      <LogoutEverywhere />
      <DeleteAccount />
    </div>
  );
}

function ChangePassword() {
  const t = useTranslations('account');
  const tAuth = useTranslations('auth');
  const tv = useTranslations('validation');
  const errorMessage = useErrorMessage();
  const user = useAuthStore((s) => s.user);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const schema = useMemo(
    () =>
      withPasswordRules(
        tv,
        { currentPassword: z.string().min(1, tv('required')) },
        { password: 'newPassword', confirmation: 'confirmation' },
        () => user?.email ?? ''
      ),
    [tv, user?.email]
  );
  type Values = { currentPassword: string; newPassword: string; confirmation: string };
  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema) as never,
    defaultValues: { currentPassword: '', newPassword: '', confirmation: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setDone(false);
    setError('');
    try {
      await MeApi.changePassword(values.currentPassword, values.newPassword);
      reset();
      setDone(true);
    } catch (err) {
      const fields = errorFields(err);
      if (fields.includes('currentPassword')) {
        setFieldError('currentPassword', { type: 'server', message: t('wrongPassword') });
      } else if (fields.length > 0) {
        setFieldError('newPassword', { type: 'server', message: tv('passwordWeak') });
      } else {
        setError(errorMessage(err));
      }
    }
  });

  return (
    <Card>
      <h2 className="text-lg font-bold text-[#222222] mb-1">{t('changePassword')}</h2>
      <p className="text-xs text-gray-500 mb-4">{t('changePasswordHint')}</p>
      <form onSubmit={onSubmit} noValidate className="space-y-4 max-w-md">
        {done && <Alert tone="success">{t('passwordChanged')}</Alert>}
        {error && <Alert>{error}</Alert>}
        <Field id="cp-current" label={t('currentPassword')} error={errors.currentPassword?.message}>
          {(a) => <PasswordInput {...a} {...register('currentPassword')} autoComplete="current-password" />}
        </Field>
        <Field id="cp-new" label={tAuth('newPassword')} error={errors.newPassword?.message} hint={tAuth('passwordHint')}>
          {(a) => <PasswordInput {...a} {...register('newPassword')} autoComplete="new-password" />}
        </Field>
        <Field id="cp-confirm" label={tAuth('passwordConfirmation')} error={errors.confirmation?.message}>
          {(a) => <PasswordInput {...a} {...register('confirmation')} autoComplete="new-password" />}
        </Field>
        <Button type="submit" loading={isSubmitting}>
          {t('changePassword')}
        </Button>
      </form>
    </Card>
  );
}

function ChangeEmail() {
  const t = useTranslations('account');
  const tv = useTranslations('validation');
  const errorMessage = useErrorMessage();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState('');

  const schema = useMemo(
    () => z.object({ newEmail: emailField(tv), password: z.string().min(1, tv('required')) }),
    [tv]
  );
  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { newEmail: '', password: '' } });

  const onSubmit = handleSubmit(async ({ newEmail, password }) => {
    setError('');
    setSentTo(null);
    try {
      await MeApi.changeEmail(newEmail, password);
      reset();
      setSentTo(newEmail);
    } catch (err) {
      const fields = errorFields(err);
      if (fields.includes('password')) {
        setFieldError('password', { type: 'server', message: t('wrongPassword') });
      } else if (fields.includes('newEmail')) {
        setFieldError('newEmail', { type: 'server', message: t('sameEmail') });
      } else if (err instanceof ApiError && err.code === 'EMAIL_ALREADY_EXISTS') {
        setFieldError('newEmail', { type: 'server', message: errorMessage(err) });
      } else {
        setError(errorMessage(err));
      }
    }
  });

  return (
    <Card>
      <h2 className="text-lg font-bold text-[#222222] mb-1">{t('changeEmail')}</h2>
      <p className="text-xs text-gray-500 mb-4">{t('changeEmailHint')}</p>
      <form onSubmit={onSubmit} noValidate className="space-y-4 max-w-md">
        {sentTo && <Alert tone="success">{t('changeEmailSent', { email: sentTo })}</Alert>}
        {error && <Alert>{error}</Alert>}
        <Field id="ce-email" label={t('newEmail')} error={errors.newEmail?.message}>
          {(a) => <input {...a} {...register('newEmail')} type="email" autoComplete="email" className={inputClass} />}
        </Field>
        <Field id="ce-password" label={t('currentPassword')} error={errors.password?.message}>
          {(a) => <PasswordInput {...a} {...register('password')} autoComplete="current-password" />}
        </Field>
        <Button type="submit" loading={isSubmitting}>
          {t('changeEmail')}
        </Button>
      </form>
    </Card>
  );
}

function LogoutEverywhere() {
  const t = useTranslations('account');
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!window.confirm(t('logoutAllConfirm'))) return;
    setBusy(true);
    setError('');
    try {
      await MeApi.logoutAll();
      clear();
      router.replace('/auth/login');
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-bold text-[#222222] mb-1">{t('logoutAll')}</h2>
      <p className="text-xs text-gray-500 mb-4">{t('logoutAllHint')}</p>
      {error && <Alert className="mb-4">{error}</Alert>}
      <Button variant="secondary" onClick={run} loading={busy}>
        {t('logoutAll')}
      </Button>
    </Card>
  );
}

function DeleteAccount() {
  const t = useTranslations('account');
  const tv = useTranslations('validation');
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const [error, setError] = useState('');

  const schema = useMemo(
    () =>
      z.object({
        password: z.string().min(1, tv('required')),
        confirm: z.boolean().refine((v) => v, tv('required')),
      }),
    [tv]
  );
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { password: '', confirm: false } });

  const onSubmit = handleSubmit(async ({ password }) => {
    setError('');
    try {
      await MeApi.deleteAccount(password);
      clear();
      router.replace('/');
    } catch (err) {
      if (errorFields(err).includes('password')) {
        setFieldError('password', { type: 'server', message: t('wrongPassword') });
      } else {
        setError(errorMessage(err));
      }
    }
  });

  return (
    <Card className="border-red-200">
      <h2 className="text-lg font-bold text-red-700 mb-1">{t('deleteAccount')}</h2>
      <p className="text-xs text-gray-500 mb-4">{t('deleteAccountHint')}</p>
      <form onSubmit={onSubmit} noValidate className="space-y-4 max-w-md">
        {error && <Alert>{error}</Alert>}
        <Field id="del-password" label={t('currentPassword')} error={errors.password?.message}>
          {(a) => <PasswordInput {...a} {...register('password')} autoComplete="current-password" />}
        </Field>
        <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer">
          <input type="checkbox" {...register('confirm')} className="accent-red-600 w-4 h-4 mt-0.5" />
          {t('deleteAccountConfirm')}
        </label>
        {errors.confirm && <p className="text-[11px] text-red-600">{errors.confirm.message}</p>}
        <Button type="submit" variant="danger" loading={isSubmitting}>
          {t('deleteAccount')}
        </Button>
      </form>
    </Card>
  );
}
