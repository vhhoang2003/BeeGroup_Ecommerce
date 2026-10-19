'use client';

import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { AuthApi } from '@/lib/api/auth';
import { authErrorMessage } from '@/features/auth/store/useAuthStore';
import { AuthMessage, authButtonClass, authInputClass } from './AuthCard';

/** Asks for a new verification email (AUTH-01). The API answers the same way for unknown emails. */
export default function ResendVerification({ initialEmail = '' }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setState('sending');
    try {
      await AuthApi.resendVerification(email);
      setState('sent');
    } catch (err) {
      setError(authErrorMessage(err));
      setState('idle');
    }
  };

  if (state === 'sent') {
    return (
      <AuthMessage tone="success">
        Nếu {email} có tài khoản đang chờ xác thực, chúng tôi vừa gửi một liên kết mới. Vui lòng kiểm tra hộp thư (cả mục
        Spam).
      </AuthMessage>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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
      <button type="submit" disabled={state === 'sending'} className={authButtonClass}>
        {state === 'sending' ? 'Đang gửi…' : 'Gửi lại email xác thực'}
      </button>
    </form>
  );
}
