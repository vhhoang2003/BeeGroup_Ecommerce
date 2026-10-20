'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Heart, KeyRound, LogOut, MessageSquareText, User } from 'lucide-react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { cn } from '@/lib/utils';

export default function AccountNav() {
  const t = useTranslations('account');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [leaving, setLeaving] = useState(false);

  const items = [
    { href: '/account', label: t('profile'), icon: User },
    { href: '/account/security', label: t('security'), icon: KeyRound },
    { href: '/account/inquiries', label: t('inquiries'), icon: MessageSquareText },
    { href: '/account/wishlist', label: t('wishlist'), icon: Heart },
  ];

  const handleLogout = async () => {
    setLeaving(true);
    await logout().catch(() => undefined);
    router.push('/');
  };

  return (
    <aside className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
      {user && (
        <div className="flex items-center gap-3 pb-4 mb-3 border-b border-gray-100">
          <div className="w-11 h-11 rounded-xl bg-[#008ECC] text-white flex items-center justify-center text-lg font-bold">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[#222222] truncate">{user.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      )}
      <nav aria-label={t('navLabel')} className="flex lg:flex-col gap-1 overflow-x-auto">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
              pathname === href ? 'bg-[#EBF6FA] text-[#008ECC]' : 'text-gray-700 hover:bg-gray-50'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          disabled={leaving}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 whitespace-nowrap cursor-pointer disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {t('logout')}
        </button>
      </nav>
    </aside>
  );
}
