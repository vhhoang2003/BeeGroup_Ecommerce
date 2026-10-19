'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import ResendVerification from '@/features/auth/components/ResendVerification';

/** `?next=` from a guarded page (same-site paths only), else the home of the user's role. */
function redirectTarget(role: string | undefined): string {
  const next = new URLSearchParams(window.location.search).get('next');
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  return role === 'ADMIN' ? '/admin/products' : '/account';
}

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUnverified(false);
    setLoading(true);
    const result = await login(email, password, rememberMe);
    setLoading(false);
    if (result.ok) {
      router.push(redirectTarget(result.user?.role));
    } else {
      setError(result.error);
      setUnverified(result.code === 'EMAIL_NOT_VERIFIED');
    }
  };

  return (
    <div className="max-w-[480px] mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#EBF6FA] text-[#008ECC] flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#222222]">Welcome Back</h1>
          <p className="text-xs text-gray-500 mt-1">
            Sign in to track your quote requests and wishlist
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl mb-4 border border-red-100">
            {error}
          </div>
        )}
        {unverified && (
          <div className="mb-5">
            <ResendVerification initialEmail={email} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full bg-[#F9FBFD] border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#222222] outline-none focus:border-[#008ECC]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-xs text-[#008ECC] hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F9FBFD] border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#222222] outline-none focus:border-[#008ECC]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="accent-[#008ECC]"
            />
            Remember me
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#008ECC] hover:bg-[#0077b0] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="font-semibold text-[#008ECC] hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}
