'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSlide {
  id: string;
  subtitle: string;
  title: string;
  description: string;
  image: string;
  cta: string;
  link: string;
}

const slides: HeroSlide[] = [
  {
    id: 'zen-2',
    subtitle: 'AMD EPYC 7002 · Rome · Zen 2',
    title: 'CPU SERVER EPYC.',
    description: 'Từ 8 tới 64 nhân, 128 lane PCIe 4.0, RAM DDR4 8 kênh. Hợp cho home lab, NAS và ảo hoá.',
    image: '/storage/CPU/Epyc%207402/images/03-in-socket.jpg',
    cta: 'Xem dòng Zen 2',
    link: '/category/cpu?sub=zen-2',
  },
  {
    id: 'zen-3',
    subtitle: 'AMD EPYC 7003 · Milan · Zen 3',
    title: 'HIỆU NĂNG ZEN 3.',
    description: 'EPYC 7663, 7B13, 7V13, 7V73X: nhiều nhân, cache lớn, chạy trên mainboard SP3.',
    image: '/storage/CPU/Epyc%207V73X/images/01-top.jpg',
    cta: 'Xem dòng Zen 3',
    link: '/category/cpu?sub=zen-3',
  },
  {
    id: 'platform',
    subtitle: 'Mainboard · GPU · Tản nhiệt',
    title: 'TRỌN BỘ NỀN TẢNG.',
    description: 'Mainboard SP3 1P/2P, GPU NVIDIA Tesla A2 và tản nhiệt AIO / khí cho EPYC.',
    image: '/storage/CPU/Epyc%207532/images/04-carrier.jpg',
    cta: 'Xem tất cả sản phẩm',
    link: '/products',
  },
];

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const active = slides[currentSlide];

  return (
    <div className="relative w-full max-w-[1240px] mx-auto px-4 mt-4 sm:mt-6 mb-8 sm:mb-10">
      {/* Main Navy Card */}
      <div className="relative w-full bg-[#212844] rounded-[20px] sm:rounded-[24px] overflow-hidden min-h-[300px] sm:min-h-[350px] flex items-center px-6 sm:px-12 py-8 sm:py-10 shadow-md">
        {/* Photo on the right, faded into the navy background */}
        <div className="absolute inset-y-0 right-0 w-full md:w-[60%]">
          <Image
            key={active.id}
            src={active.image}
            alt={active.title}
            fill
            sizes="(max-width: 768px) 100vw, 750px"
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#212844] via-[#212844]/70 md:via-[#212844]/40 to-transparent" />
        </div>

        {/* Left Text Content */}
        <div className="relative z-10 max-w-[520px] flex flex-col justify-center text-white">
          <p className="text-[14px] sm:text-[16px] font-medium text-[#F5B301] mb-1.5 sm:mb-2 tracking-wide">
            {active.subtitle}
          </p>

          <h1 className="text-[28px] sm:text-[40px] md:text-[48px] font-black text-white tracking-tight leading-[1.1] mb-3">
            {active.title}
          </h1>

          <p className="text-[14px] sm:text-[16px] text-white/85 mb-6 leading-relaxed">{active.description}</p>

          <div className="flex items-center gap-4">
            <Link
              href={active.link}
              className="inline-flex items-center justify-center bg-[#008ECC] hover:bg-[#0077b0] text-white text-[14px] sm:text-[15px] font-semibold px-6 py-2.5 rounded-full transition-all shadow-sm hover:shadow"
            >
              {active.cta}
            </Link>

            <div className="flex items-center gap-1.5 ml-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Slide ${index + 1}`}
                  className={`h-2 transition-all rounded-full cursor-pointer ${
                    index === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Navigation Controls (Left & Right circles) */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Slide trước"
        className="absolute -left-1 sm:left-1 top-1/2 -translate-y-1/2 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-white text-[#008ECC] shadow-lg border border-gray-100 flex items-center justify-center hover:bg-[#F3F9FB] hover:scale-105 transition-all z-20 cursor-pointer"
      >
        <ChevronLeft className="w-5 sm:w-6 h-5 sm:h-6 stroke-[2.5]" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Slide tiếp"
        className="absolute -right-1 sm:right-1 top-1/2 -translate-y-1/2 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-white text-[#008ECC] shadow-lg border border-gray-100 flex items-center justify-center hover:bg-[#F3F9FB] hover:scale-105 transition-all z-20 cursor-pointer"
      >
        <ChevronRight className="w-5 sm:w-6 h-5 sm:h-6 stroke-[2.5]" />
      </button>
    </div>
  );
}
