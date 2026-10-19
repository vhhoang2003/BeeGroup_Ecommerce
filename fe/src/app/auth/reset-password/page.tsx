'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { KeyRound, Lock } from 'lucide-react';
import { AuthApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { authErrorMessage } from '@/features/auth/store/useAuthStore';
import { passwordProblem } from '@/features/auth/passwordPolicy';
import AuthCard, { AuthMessage, authButtonClass, authInputClass } from '@/features/auth/components/AuthCard';

/** Target of the link in the reset email: `/auth/reset-password?token=…` (AUTH-06). */
function ResetPassword() {
  const token = useSearchParams().get('token');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [linkDead, setLinkDead] = useState(!token);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const problem = passwordProblem(password);
    if (problem) {
      setError(problem);
      return;
    }
    if (password !== confirmation) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setSaving(true);
    try {
      await AuthApi.resetPassword(token!, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'TOKEN_INVALID_OR_EXPIRED') setLinkDead(true);
      else setError(authErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <AuthCard icon={KeyRound} title="Đã đổi mật khẩu" subtitle="Các phiên đăng nhập cũ đã được đăng xuất.">
        <Link href="/auth/login" className={authButtonClass}>
          Đăng nhập với mật khẩu mới
        </Link>
      </AuthCard>
    );
  }

  if (linkDead) {
    return (
      <AuthCard icon={KeyRound} title="Liên kết không còn hiệu lực" subtitle="Liên kết đặt lại mật khẩu đã hết hạn hoặc đã được dùng.">
        <Link href="/auth/forgot-password" className={authButtonClass}>
          Gửi liên kết mới
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard icon={KeyRound} title="Đặt mật khẩu mới">
      {error && <AuthMessage tone="error">{error}</AuthMessage>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu mới"
              aria-label="Mật khẩu mới"
              className={authInputClass}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">8-72 ký tự, gồm cả chữ và số.</p>
        </div>
        <div className="relative">
          <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            aria-label="Nhập lại mật khẩu mới"
            className={authInputClass}
          />
        </div>
        <button type="submit" disabled={saving} className={authButtonClass}>
          {saving ? 'Đang lưu…' : 'Đổi mật khẩu'}
        </button>
      </form>
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
