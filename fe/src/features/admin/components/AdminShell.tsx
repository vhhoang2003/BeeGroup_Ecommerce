'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, LogOut, Package, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { USE_MOCK } from '@/lib/api/client';
import Logo from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const NAV = [{ href: '/admin/products', label: 'Sản phẩm', icon: Package }];

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F5F7FA]">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <ShieldAlert className="w-10 h-10 text-[#008ECC] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#222222] mb-2">{title}</h1>
        <div className="text-sm text-gray-600 space-y-4">{children}</div>
      </div>
    </div>
  );
}

/** Admin area chrome and guard: only signed-in ADMIN users get past it (the API enforces the same, SEC-05). */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initialized, logout } = useAuthStore();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!USE_MOCK && initialized && !user && !leaving) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [initialized, user, leaving, pathname, router]);

  if (USE_MOCK) {
    return (
      <Notice title="Trang quản trị cần backend">
        <p>
          Ứng dụng đang chạy với dữ liệu mẫu (<code>NEXT_PUBLIC_USE_MOCK</code>). Đặt{' '}
          <code>NEXT_PUBLIC_USE_MOCK=false</code> và trỏ <code>NEXT_PUBLIC_API_URL</code> tới API để quản lý sản phẩm.
        </p>
        <Link href="/" className="inline-block text-[#008ECC] font-semibold hover:underline">
          Về trang chủ
        </Link>
      </Notice>
    );
  }

  if (!initialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <Loader2 className="w-6 h-6 text-[#008ECC] animate-spin" />
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <Notice title="Không có quyền truy cập">
        <p>Tài khoản {user.email} không phải quản trị viên.</p>
        <Link href="/" className="inline-block text-[#008ECC] font-semibold hover:underline">
          Về trang chủ
        </Link>
      </Notice>
    );
  }

  const handleLogout = async () => {
    // Logging out on purpose goes home, not to the login page the guard would pick.
    setLeaving(true);
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F5F7FA] text-[#222222]">
      <aside className="md:w-56 md:min-h-screen bg-white border-b md:border-b-0 md:border-r border-gray-200 flex md:flex-col">
        <div className="hidden md:block px-5 py-5 border-b border-gray-100">
          <Logo />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mt-2">Quản trị</p>
        </div>
        <nav className="flex md:flex-col flex-1 gap-1 p-2 md:p-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(href) ? 'bg-[#EBF6FA] text-[#008ECC]' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex md:flex-col gap-1 p-2 md:p-3 md:border-t border-gray-100">
          <p className="hidden md:block px-3 pb-1 text-xs text-gray-500 truncate" title={user.email}>
            {user.email}
          </p>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Về cửa hàng</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
