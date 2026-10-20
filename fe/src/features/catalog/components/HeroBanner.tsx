'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface HeroSlide {
  id: 'zen2' | 'zen3' | 'platform';
  image: string;
  link: string;
}

/** Texts live in `messages/*.json` under `hero.<id>` (subtitle, title, description, cta). */
const slides: HeroSlide[] = [
  { id: 'zen2', image: '/storage/CPU/Epyc%207402/images/03-in-socket.jpg', link: '/category/cpu?sub=zen-2' },
  { id: 'zen3', image: '/storage/CPU/Epyc%207V73X/images/01-top.jpg', link: '/category/cpu?sub=zen-3' },
  { id: 'platform', image: '/storage/CPU/Epyc%207532/images/04-carrier.jpg', link: '/products' },
];

export default function HeroBanner() {
  const t = useTranslations('hero');
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
            alt={t(`${active.id}.title`)}
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
            {t(`${active.id}.subtitle`)}
          </p>

          <h1 className="text-[28px] sm:text-[40px] md:text-[48px] font-black text-white tracking-tight leading-[1.1] mb-3">
            {t(`${active.id}.title`)}
          </h1>

          <p className="text-[14px] sm:text-[16px] text-white/85 mb-6 leading-relaxed">
            {t(`${active.id}.description`)}
          </p>

          <div className="flex items-center gap-4">
            <Link
              href={active.link}
              className="inline-flex items-center justify-center bg-[#008ECC] hover:bg-[#0077b0] text-white text-[14px] sm:text-[15px] font-semibold px-6 py-2.5 rounded-full transition-all shadow-sm hover:shadow"
            >
              {t(`${active.id}.cta`)}
            </Link>

            <div className="flex items-center gap-1.5 ml-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentSlide(index)}
                  aria-label={t('goTo', { n: index + 1 })}
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
        aria-label={t('prev')}
        className="absolute -left-1 sm:left-1 top-1/2 -translate-y-1/2 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-white text-[#008ECC] shadow-lg border border-gray-100 flex items-center justify-center hover:bg-[#F3F9FB] hover:scale-105 transition-all z-20 cursor-pointer"
      >
        <ChevronLeft className="w-5 sm:w-6 h-5 sm:h-6 stroke-[2.5]" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label={t('next')}
        className="absolute -right-1 sm:right-1 top-1/2 -translate-y-1/2 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-white text-[#008ECC] shadow-lg border border-gray-100 flex items-center justify-center hover:bg-[#F3F9FB] hover:scale-105 transition-all z-20 cursor-pointer"
      >
        <ChevronRight className="w-5 sm:w-6 h-5 sm:h-6 stroke-[2.5]" />
      </button>
    </div>
  );
}
