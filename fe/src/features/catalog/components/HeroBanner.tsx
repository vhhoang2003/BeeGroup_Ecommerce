'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSlide {
  id: string;
  subtitle: string;
  title: string;
  highlight: string;
  discount: string;
  image: string;
  link: string;
}

const slides: HeroSlide[] = [
  {
    id: 'slide-1',
    subtitle: 'Best Deal Online on smart watches',
    title: 'SMART WEARABLE.',
    highlight: '',
    discount: 'UP to 80% OFF',
    image: '/images/hero/smartwatch.png',
    link: '/products/active-pro-smart-wearable',
  },
  {
    id: 'slide-2',
    subtitle: 'Latest Flagship Innovations',
    title: 'GALAXY SERIES.',
    highlight: '',
    discount: 'UP to 56% OFF',
    image: '/images/products/s22_ultra_blue.png',
    link: '/products/galaxy-s22-ultra-blue',
  },
  {
    id: 'slide-3',
    subtitle: 'Farm Fresh Harvest Delivered Daily',
    title: 'DAILY ESSENTIALS.',
    highlight: '',
    discount: 'UP to 50% OFF',
    image: '/images/essentials/daily_essentials.png',
    link: '/category/groceries',
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
      <div className="relative w-full bg-[#212844] rounded-[20px] sm:rounded-[24px] overflow-hidden min-h-[300px] sm:min-h-[350px] flex items-center justify-between px-6 sm:px-12 py-8 sm:py-10 shadow-md">
        {/* Left Text Content */}
        <div className="z-10 max-w-[550px] flex flex-col justify-center text-white">
          <p className="text-[15px] sm:text-[18px] md:text-[20px] font-normal text-white/95 mb-1.5 sm:mb-2 tracking-wide">
            {active.subtitle}
          </p>

          <h1 className="text-[28px] sm:text-[40px] md:text-[48px] font-black text-white tracking-tight leading-[1.1] mb-2 sm:mb-3">
            {active.title}
          </h1>

          <p className="text-[17px] sm:text-[22px] md:text-[24px] font-bold text-white mb-6">
            {active.discount}
          </p>

          <div className="flex items-center gap-4">
            <Link
              href={active.link}
              className="inline-flex items-center justify-center bg-[#008ECC] hover:bg-[#0077b0] text-white text-[14px] sm:text-[15px] font-semibold px-6 py-2.5 rounded-full transition-all shadow-sm hover:shadow"
            >
              Shop Now
            </Link>

            {/* Pagination Indicators matching mockup bottom-left */}
            <div className="flex items-center gap-1.5 ml-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`h-2 transition-all rounded-full cursor-pointer ${
                    index === currentSlide
                      ? 'w-6 bg-white'
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Image Graphic */}
        <div className="relative shrink-0 w-[200px] sm:w-[320px] md:w-[420px] h-[220px] sm:h-[300px] flex items-center justify-center">
          <Image
            src={active.image}
            alt={active.title}
            fill
            sizes="(max-width: 768px) 200px, 420px"
            priority
            className="object-contain drop-shadow-2xl transition-all duration-500 scale-100 hover:scale-105"
          />
        </div>
      </div>

      {/* Floating Navigation Controls (Left & Right circles) */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Previous slide"
        className="absolute -left-1 sm:left-1 top-1/2 -translate-y-1/2 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-white text-[#008ECC] shadow-lg border border-gray-100 flex items-center justify-center hover:bg-[#F3F9FB] hover:scale-105 transition-all z-20 cursor-pointer"
      >
        <ChevronLeft className="w-5 sm:w-6 h-5 sm:h-6 stroke-[2.5]" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Next slide"
        className="absolute -right-1 sm:right-1 top-1/2 -translate-y-1/2 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-white text-[#008ECC] shadow-lg border border-gray-100 flex items-center justify-center hover:bg-[#F3F9FB] hover:scale-105 transition-all z-20 cursor-pointer"
      >
        <ChevronRight className="w-5 sm:w-6 h-5 sm:h-6 stroke-[2.5]" />
      </button>
    </div>
  );
}
