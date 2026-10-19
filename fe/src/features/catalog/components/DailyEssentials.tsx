'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import SectionTitle from '@/components/ui/SectionTitle';
import { CatalogApi } from '@/lib/api/endpoints';
import { mockDailyEssentials } from '@/lib/mocks/data';

export default function DailyEssentials() {
  const { data: essentials = mockDailyEssentials } = useQuery({
    queryKey: ['deals', 'essentials'],
    queryFn: () => CatalogApi.getDailyEssentials(),
    initialData: mockDailyEssentials,
  });

  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 mb-14 sm:mb-16">
      <SectionTitle
        prefix="Daily"
        highlight="Essentials"
        viewAllHref="/category/groceries"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
        {essentials.map((item) => (
          <Link
            key={item.id}
            href={`/category/groceries?item=${item.slug}`}
            className="group flex flex-col items-center"
          >
            {/* Image Box */}
            <div className="w-full bg-[#F5F5F5] rounded-[16px] p-2 sm:p-3 flex items-center justify-center h-[120px] sm:h-[135px] relative overflow-hidden mb-2.5 border border-[#EDEDED] group-hover:border-[#008ECC] group-hover:bg-[#EEF7FB] transition-all duration-200 group-hover:shadow-sm">
              <div className="relative w-full h-full">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 140px, 180px"
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Title & Discount Text */}
            <span className="text-[13px] sm:text-[14px] font-medium text-[#222222] text-center group-hover:text-[#008ECC] transition-colors line-clamp-1">
              {item.name}
            </span>
            <span className="text-[12px] sm:text-[13px] font-bold text-[#222222] text-center mt-0.5">
              {item.discount}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
