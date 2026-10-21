'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { HexagonIcon, OrbitPattern, TechGridPattern } from '@/components/ui/BrandDecorations';

interface HeroSlide {
  id: 'zen2' | 'zen3' | 'kvm' | 'platform';
  image: string;
  link: string;
}

/** Texts live in `messages/*.json` under `hero.<id>` (subtitle, title, description, cta). */
const slides: HeroSlide[] = [
  { id: 'zen2', image: '/storage/CPU/Epyc%207402/images/03-in-socket.jpg', link: '/category/cpu?sub=zen-2' },
  { id: 'zen3', image: '/storage/CPU/Epyc%207V73X/images/01-top.jpg', link: '/category/cpu?sub=zen-3' },
  { id: 'kvm', image: '/storage/KVM/Comet%20Pro%20GL-RM10/images/01-front.jpg', link: '/category/kvm' },
  { id: 'platform', image: '/storage/CPU/Epyc%207532/images/04-carrier.jpg', link: '/products' },
];

export default function HeroBanner() {
  const t = useTranslations('hero');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, []);

  // Auto-slide every 6 seconds, pauses on user interaction
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(handleNext, 6000);
    return () => clearInterval(timer);
  }, [isPaused, handleNext]);

  const active = slides[currentSlide];

  return (
    <div
      className="relative w-full max-w-[1240px] mx-auto px-4 mt-3 sm:mt-5 mb-8 sm:mb-10 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Hero Highlights"
    >
      {/* Main Container */}
      <div className="relative w-full bg-ink rounded-[24px] sm:rounded-[32px] overflow-hidden min-h-[380px] sm:min-h-[440px] md:min-h-[480px] flex items-center px-6 sm:px-12 md:px-16 py-10 sm:py-14 shadow-2xl border border-white/10">
        {/* Subtle Tech Pattern and Orbit Ornaments */}
        <div className="absolute inset-0 opacity-15 text-white pointer-events-none">
          <TechGridPattern />
        </div>
        <div className="absolute -right-20 -bottom-20 w-[550px] h-[300px] pointer-events-none opacity-30">
          <OrbitPattern />
        </div>

        {/* Ambient Gold Radial Highlight */}
        <div
          className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-honey/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Slide Photo on the right with smooth fade */}
        <div className="absolute inset-y-0 right-0 w-full md:w-[62%] overflow-hidden">
          {slides.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10'
                }`}
                aria-hidden={!isActive}
              >
                <Image
                  src={slide.image}
                  alt={t(`${slide.id}.title`)}
                  fill
                  sizes="(max-width: 768px) 100vw, 800px"
                  priority={index === 0}
                  className={`object-cover transition-transform duration-1000 ease-out ${
                    isActive ? 'scale-100' : 'scale-105'
                  }`}
                />
              </div>
            );
          })}
          {/* Multi-step gradient fade for high contrast readability */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-ink via-ink/80 md:via-ink/65 to-transparent z-10" />
        </div>

        {/* Left Content (Text + CTAs) */}
        <div className="relative z-20 max-w-[560px] flex flex-col justify-center text-white">
          {/* Subtitle pill with hexagon accent */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-honey/15 border border-honey/30 text-honey text-xs sm:text-[13px] font-bold tracking-wider uppercase mb-3.5 w-fit shadow-xs">
            <HexagonIcon className="w-3.5 h-3.5 text-honey" />
            <span>{t(`${active.id}.subtitle`)}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-[28px] sm:text-[42px] md:text-[50px] font-black text-white tracking-tight leading-[1.08] mb-4">
            {t(`${active.id}.title`)}
          </h1>

          {/* Description */}
          <p className="text-[14px] sm:text-[16px] text-slate-300 mb-8 leading-relaxed max-w-[500px]">
            {t(`${active.id}.description`)}
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link
              href={active.link}
              className="inline-flex items-center justify-center gap-2 bg-honey hover:bg-honey-400 text-ink text-[14px] sm:text-[15px] font-extrabold px-7 py-3 rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-honey/20 hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
            >
              <span>{t(`${active.id}.cta`)}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>

            {/* Slide Navigation Dots */}
            <div className="flex items-center gap-2 py-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentSlide(index)}
                  aria-label={t('goTo', { n: index + 1 })}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer min-h-[16px] min-w-[16px] flex items-center justify-center ${
                    index === currentSlide ? 'w-8 bg-honey' : 'w-2.5 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Prev / Next Controls */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label={t('prev')}
        className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-ink/80 hover:bg-ink text-white border border-white/20 hover:border-honey/60 shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer focus-visible:outline-honey-500"
      >
        <ChevronLeft className="w-5 h-5 text-honey stroke-[2.5]" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label={t('next')}
        className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-ink/80 hover:bg-ink text-white border border-white/20 hover:border-honey/60 shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer focus-visible:outline-honey-500"
      >
        <ChevronRight className="w-5 h-5 text-honey stroke-[2.5]" />
      </button>
    </div>
  );
}
