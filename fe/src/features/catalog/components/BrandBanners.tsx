'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SectionTitle from '@/components/ui/SectionTitle';
import { mockBrandBanners } from '@/lib/mocks/data';

export default function BrandBanners() {
  const [activeDot, setActiveDot] = useState(0);

  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 mb-10 sm:mb-12">
      <SectionTitle
        prefix="Top"
        highlight="Electronics Brands"
        viewAllHref="/products?category=electronics"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-5">
        {mockBrandBanners.map((brand) => (
          <Link
            key={brand.id}
            href={brand.link}
            className="group relative rounded-[18px] sm:rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 block border border-black/5"
          >
            <div className="relative w-full h-[180px] sm:h-[200px]">
              <Image
                src={brand.productImage}
                alt={`${brand.name} Banner`}
                fill
                sizes="(max-width: 768px) 100vw, 380px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination dots below cards matching mockup */}
      <div className="flex items-center justify-center gap-1.5 py-1">
        {[...Array(6)].map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveDot(i)}
            aria-label={`Brand page ${i + 1}`}
            className={`h-1.5 transition-all rounded-full cursor-pointer ${
              i === activeDot
                ? 'w-5 bg-[#008ECC]'
                : 'w-1.5 bg-[#D5D5D5] hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
