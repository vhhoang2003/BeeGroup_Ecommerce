'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, User, Mail, Lock, ArrowRight, MailCheck } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { passwordProblem } from '@/features/auth/passwordPolicy';

const inputClass =
  'w-full bg-[#F9FBFD] border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#222222] outline-none focus:border-[#008ECC]';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const problem = passwordProblem(password, email);
    if (problem) {
      setError(problem);
      return;
    }
    if (password !== confirmation) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!acceptTerms) {
      setError('Vui lòng đồng ý với Điều khoản và Chính sách bảo mật.');
      return;
    }
    setLoading(true);
    const result = await register({
      fullName: name,
      email,
      password,
      passwordConfirmation: confirmation,
      acceptTerms,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
    } else if (result.pendingVerification) {
      setSentTo(email);
    } else {
      router.push('/account');
    }
  };

  if (sentTo) {
    return (
      <div className="max-w-[480px] mx-auto px-4 py-12 sm:py-16">
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#EBF6FA] text-[#008ECC] flex items-center justify-center mx-auto mb-3">
            <MailCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#222222]">Kiểm tra email của bạn</h1>
          <p className="text-sm text-gray-600 mt-2">
            Chúng tôi đã gửi liên kết xác thực tới <strong>{sentTo}</strong>. Mở liên kết đó rồi đăng nhập.
          </p>
          <Link
            href="/auth/login"
            className="inline-block mt-6 bg-[#008ECC] hover:bg-[#0077b0] text-white px-8 py-3 rounded-full font-bold text-sm shadow-md transition-all"
          >
            Đến trang đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#EBF6FA] text-[#008ECC] flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#222222]">Create Account</h1>
          <p className="text-xs text-gray-500 mt-1">
            Join Bee Store to request quotes and track your inquiries
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Hoang Nguyen"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Create Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">8-72 ký tự, gồm cả chữ và số.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="accent-[#008ECC] mt-0.5"
            />
            Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật.
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#008ECC] hover:bg-[#0077b0] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Registering...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-[#008ECC] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
