'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MailCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import AuthCard from '@/features/auth/components/AuthCard';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { Alert, Button, Spinner, inputClass } from '@/components/ui/form';
import { AuthApi, MeApi } from '@/lib/api/endpoints';
import { useErrorMessage } from '@/lib/api/errors';

type State = 'verifying' | 'verified' | 'failed';

/**
 * Landing page of the verification email (AUTH-04) and of the email-change confirmation (AUTH-14). The token is
 * single-use, so it is posted exactly once even under React Strict Mode's double effects.
 */
function VerifyEmail() {
  const t = useTranslations('auth');
  const errorMessage = useErrorMessage();
  const token = useSearchParams().get('token');
  const { isAuthenticated, setUser } = useAuthStore();
  const [state, setState] = useState<State>(token ? 'verifying' : 'failed');
  const [error, setError] = useState(token ? '' : t('missingToken'));
  const [email, setEmail] = useState('');
  const [resent, setResent] = useState(false);
  const posted = useRef(false);

  useEffect(() => {
    if (!token || posted.current) return;
    posted.current = true;
    AuthApi.verifyEmail(token)
      .then(() => setState('verified'))
      .catch((err) => {
        setError(errorMessage(err));
        setState('failed');
      });
  }, [token, errorMessage]);

  // A confirmed email change updates the profile of the signed-in user.
  useEffect(() => {
    if (state === 'verified' && isAuthenticated) MeApi.get().then(setUser).catch(() => undefined);
  }, [state, isAuthenticated, setUser]);

  const resend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await AuthApi.resendVerification(email.trim());
      setResent(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (state === 'verifying') {
    return (
      <AuthCard icon={MailCheck} title={t('verifyTitle')}>
        <Spinner label={t('verifying')} />
      </AuthCard>
    );
  }

  if (state === 'verified') {
    return (
      <AuthCard icon={MailCheck} title={t('verifiedTitle')} subtitle={t('verifiedBody')}>
        <Link
          href={isAuthenticated ? '/account' : '/auth/login'}
          className="block text-center bg-ink hover:bg-ink-800 text-white py-3 rounded-xl font-bold text-sm"
        >
          {isAuthenticated ? t('goToAccount') : t('goToLogin')}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard icon={MailCheck} title={t('verifyFailedTitle')}>
      <Alert className="mb-4">{error}</Alert>
      {resent ? (
        <Alert tone="success">{t('verificationResent')}</Alert>
      ) : (
        <form onSubmit={resend} className="space-y-3">
          <label htmlFor="resend-email" className="block text-xs font-semibold text-slate-700">
            {t('resendPrompt')}
          </label>
          <input
            id="resend-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={inputClass}
          />
          <Button type="submit" className="w-full">
            {t('resendVerification')}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
