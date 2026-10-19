'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, MessageSquareText, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, initialized, logout } = useAuthStore();

  if (!initialized) {
    return <div className="min-h-[50vh]" />;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-[500px] mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#EBF6FA] text-[#008ECC] flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#222222] mb-2">Cần đăng nhập</h2>
        <p className="text-sm text-gray-500 mb-6">
          Đăng nhập để xem thông tin tài khoản và các yêu cầu báo giá của bạn.
        </p>
        <Link
          href="/auth/login"
          className="inline-block bg-[#008ECC] hover:bg-[#0077b0] text-white px-8 py-3 rounded-full font-bold text-sm shadow-md transition-all"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const fields = [
    { label: 'Họ và tên', value: user.name },
    { label: 'Email', value: user.email },
    { label: 'Số điện thoại', value: user.phone ?? '—' },
  ];

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 sm:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#008ECC] text-white flex items-center justify-center text-xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222]">{user.name}</h1>
            <p className="text-xs sm:text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user.role === 'ADMIN' && (
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#008ECC] bg-[#EBF6FA] hover:bg-[#dbeff7] px-4 py-2 rounded-xl transition-colors w-fit"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Trang quản trị</span>
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors w-fit"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-7 bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
          <h2 className="text-lg font-bold text-[#222222] mb-4">Thông tin cá nhân</h2>
          <div className="max-w-md space-y-4">
            {fields.map((field) => (
              <div key={field.label}>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{field.label}</label>
                <input
                  type="text"
                  disabled
                  value={field.value}
                  className="w-full bg-[#F5F5F5] border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-[#222222]"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-5 bg-[#F3F9FB] rounded-2xl border border-[#E0F0F8] p-6 sm:p-8">
          <MessageSquareText className="w-6 h-6 text-[#008ECC] mb-3" />
          <h2 className="text-lg font-bold text-[#222222] mb-2">Yêu cầu báo giá của tôi</h2>
          <p className="text-sm text-gray-600 mb-4">
            Danh sách yêu cầu báo giá và trạng thái xử lý sẽ hiển thị ở đây khi hệ thống backend sẵn sàng.
          </p>
          <Link href="/products" className="text-sm font-semibold text-[#008ECC] hover:underline">
            Xem sản phẩm →
          </Link>
        </div>
      </div>
    </div>
  );
}
