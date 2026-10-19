'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CatalogApi } from '@/lib/api/endpoints';
import CategoryIcon from '@/features/catalog/components/CategoryIcon';

export default function CategoryNav() {
  const pathname = usePathname();
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => CatalogApi.getCategories(),
  });

  const pills = [
    { name: 'Trang chủ', href: '/', slug: '', active: pathname === '/' },
    ...categories.map((c) => ({
      name: c.name,
      href: `/category/${c.slug}`,
      slug: c.slug,
      active: pathname === `/category/${c.slug}`,
    })),
    { name: 'Tất cả sản phẩm', href: '/products', slug: '', active: pathname === '/products' },
  ];

  return (
    <nav className="w-full bg-white border-b border-[#EDEDED] overflow-x-auto scrollbar-none py-2.5">
      <div className="max-w-[1240px] mx-auto px-4 flex items-center gap-2.5 sm:gap-3.5 min-w-max">
        {pills.map((pill) => (
          <Link
            key={pill.href}
            href={pill.href}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              pill.active
                ? 'bg-[#008ECC] text-white shadow-sm'
                : 'bg-[#F3F9FB] text-[#222222] hover:bg-[#E2F2F9] hover:text-[#008ECC]'
            }`}
          >
            {pill.slug && (
              <CategoryIcon
                slug={pill.slug}
                className={`w-3.5 h-3.5 ${pill.active ? 'text-white' : 'text-[#008ECC]'}`}
              />
            )}
            <span>{pill.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
