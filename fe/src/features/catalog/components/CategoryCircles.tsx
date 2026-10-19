'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import SectionTitle from '@/components/ui/SectionTitle';
import { CatalogApi } from '@/lib/api/endpoints';
import { mockCategories } from '@/lib/mocks/data';

export default function CategoryCircles() {
  const { data: categories = mockCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => CatalogApi.getCategories(),
    initialData: mockCategories,
  });

  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 mb-10 sm:mb-12">
      <SectionTitle
        prefix="Shop From"
        highlight="Top Categories"
        viewAllHref="/products"
      />

      <div className="flex items-center justify-between gap-3 sm:gap-4 overflow-x-auto scrollbar-none py-2">
        {categories.map((cat, index) => {
          const isFirst = index === 0; // "Mobile" has the active blue ring in the mockup
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex flex-col items-center shrink-0 min-w-[90px] sm:min-w-[110px]"
            >
              {/* Circular Container */}
              <div
                className={`w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full bg-[#F5F5F5] flex items-center justify-center p-3 relative overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-md ${
                  isFirst
                    ? 'border-2 border-[#008ECC] ring-4 ring-[#008ECC]/10'
                    : 'border border-[#EDEDED] group-hover:border-[#008ECC]'
                }`}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    width={90}
                    height={90}
                    className="object-contain max-h-[85%] max-w-[85%] transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
              </div>

              {/* Category Label */}
              <span className="text-[13px] sm:text-[14px] font-medium text-[#222222] group-hover:text-[#008ECC] transition-colors mt-2 text-center">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
