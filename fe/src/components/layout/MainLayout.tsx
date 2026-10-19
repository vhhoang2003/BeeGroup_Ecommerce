'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import TopUtilityBar from './TopUtilityBar';
import Header from './Header';
import CategoryNav from './CategoryNav';
import Footer from './Footer';
import MobileNav from './MobileNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const restoreSession = useAuthStore((state) => state.restoreSession);

  // The access token lives in memory only; get a new one from the refresh cookie after every page load.
  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  // The admin area has its own shell (app/admin/layout.tsx).
  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#222222] font-sans antialiased selection:bg-[#008ECC]/20 selection:text-[#008ECC]">
      {/* 1. Top Utility Bar */}
      <TopUtilityBar />

      {/* 2. Main Header */}
      <Header onToggleMobileMenu={() => setMobileMenuOpen(true)} />

      {/* 3. Category Nav Pills */}
      <CategoryNav />

      {/* Mobile Drawer */}
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Page Content */}
      <main className="flex-1 w-full pb-10">{children}</main>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}
