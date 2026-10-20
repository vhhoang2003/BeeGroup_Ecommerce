'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { Spinner } from '@/components/ui/form';
import type { Role } from '@/types/user';

/**
 * Client-side guard for `/account/**` and `/admin/**` (README §6.3). The refresh cookie is scoped to
 * `/api/v1/auth`, so the proxy cannot see it; the API's role checks remain the real enforcement point.
 */
export default function RequireAuth({ role, children }: { role?: Role; children: React.ReactNode }) {
  const t = useTranslations('auth');
  const { status, user } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'anonymous') router.replace(`/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
  }, [status, pathname, router]);

  if (status !== 'authenticated' || !user) return <Spinner label={t('checkingSession')} />;

  if (role && user.role !== role) {
    return (
      <div className="max-w-[500px] mx-auto px-4 py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#222222] mb-2">{t('forbiddenTitle')}</h1>
        <p className="text-sm text-gray-500 mb-6">{t('forbiddenBody')}</p>
        <Link href="/" className="inline-block bg-[#008ECC] text-white px-6 py-2.5 rounded-full font-semibold text-sm">
          {t('backHome')}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
