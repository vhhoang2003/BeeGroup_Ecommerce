'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound, Mail } from 'lucide-react';
import { AuthApi } from '@/lib/api/auth';
import { authErrorMessage } from '@/features/auth/store/useAuthStore';
import AuthCard, { AuthMessage, authButtonClass, authInputClass } from '@/features/auth/components/AuthCard';

/** Requests a password reset link (AUTH-06). The API answers the same way whether or not the email exists. */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await AuthApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthCard icon={KeyRound} title="Quên mật khẩu" subtitle="Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.">
      {sent ? (
        <AuthMessage tone="success">
          Nếu {email} có tài khoản, chúng tôi vừa gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (cả mục Spam).
        </AuthMessage>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <AuthMessage tone="error">{error}</AuthMessage>}
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              aria-label="Email"
              className={authInputClass}
            />
          </div>
          <button type="submit" disabled={sending} className={authButtonClass}>
            {sending ? 'Đang gửi…' : 'Gửi liên kết'}
          </button>
        </form>
      )}
      <p className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
        Nhớ ra mật khẩu?{' '}
        <Link href="/auth/login" className="font-semibold text-[#008ECC] hover:underline">
          Đăng nhập
        </Link>
      </p>
    </AuthCard>
  );
}
