'use client';

import React, { useState } from 'react';
import TopUtilityBar from './TopUtilityBar';
import Header from './Header';
import CategoryNav from './CategoryNav';
import Footer from './Footer';
import CartDrawer from '@/features/cart/components/CartDrawer';
import MobileNav from './MobileNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#222222] font-sans antialiased selection:bg-[#008ECC]/20 selection:text-[#008ECC]">
      {/* 1. Top Utility Bar */}
      <TopUtilityBar />

      {/* 2. Main Header */}
      <Header onToggleMobileMenu={() => setMobileMenuOpen(true)} />

      {/* 3. Category Nav Pills */}
      <CategoryNav />

      {/* Mobile Drawer */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Cart Drawer Modal */}
      <CartDrawer />

      {/* Main Page Content */}
      <main className="flex-1 w-full pb-10">
        {children}
      </main>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}
