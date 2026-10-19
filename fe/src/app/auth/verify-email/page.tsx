'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, MailCheck, MailX } from 'lucide-react';
import { AuthApi } from '@/lib/api/auth';
import { authErrorMessage } from '@/features/auth/store/useAuthStore';
import AuthCard, { authButtonClass } from '@/features/auth/components/AuthCard';
import ResendVerification from '@/features/auth/components/ResendVerification';

type State = { status: 'verifying' } | { status: 'verified' } | { status: 'failed'; message: string };

/** Target of the link in the registration / email-change email: `/auth/verify-email?token=…` (AUTH-01). */
function VerifyEmail() {
  const token = useSearchParams().get('token');
  const [state, setState] = useState<State>(
    token ? { status: 'verifying' } : { status: 'failed', message: 'Liên kết xác thực bị thiếu mã.' }
  );
  // A token works once; React's dev double-effect must not spend it twice.
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    AuthApi.verifyEmail(token)
      .then(() => setState({ status: 'verified' }))
      .catch((error) => setState({ status: 'failed', message: authErrorMessage(error) }));
  }, [token]);

  if (state.status === 'verifying') {
    return (
      <AuthCard icon={MailCheck} title="Đang xác thực email…">
        <Loader2 className="w-6 h-6 text-[#008ECC] animate-spin mx-auto" />
      </AuthCard>
    );
  }

  if (state.status === 'verified') {
    return (
      <AuthCard icon={MailCheck} title="Email đã được xác thực" subtitle="Tài khoản của bạn đã sẵn sàng.">
        <Link href="/auth/login" className={authButtonClass}>
          Đăng nhập
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard icon={MailX} title="Không xác thực được email" subtitle={state.message}>
      <p className="text-xs text-gray-500 mb-3">
        Liên kết chỉ dùng được một lần và có thời hạn. Nhập email đã đăng ký để nhận liên kết mới.
      </p>
      <ResendVerification />
      <p className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
        Đã xác thực rồi?{' '}
        <Link href="/auth/login" className="font-semibold text-[#008ECC] hover:underline">
          Đăng nhập
        </Link>
      </p>
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
