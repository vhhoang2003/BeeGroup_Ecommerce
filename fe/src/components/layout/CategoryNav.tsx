'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { mockNavPills } from '@/lib/mocks/data';

export default function CategoryNav() {
  const pathname = usePathname();

  return (
    <nav className="w-full bg-white border-b border-[#EDEDED] overflow-x-auto scrollbar-none py-2.5">
      <div className="max-w-[1240px] mx-auto px-4 flex items-center gap-2.5 sm:gap-3.5 min-w-max">
        {mockNavPills.map((pill) => {
          const isActive =
            (pill.slug === 'groceries' && pathname === '/') ||
            pathname.includes(pill.slug);

          return (
            <Link
              key={pill.slug}
              href={pill.slug === 'groceries' ? '/' : `/category/${pill.slug}`}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-[#008ECC] text-white shadow-sm'
                  : 'bg-[#F3F9FB] text-[#222222] hover:bg-[#E2F2F9] hover:text-[#008ECC]'
              }`}
            >
              <span>{pill.name}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  isActive ? 'text-white' : 'text-[#008ECC]'
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
