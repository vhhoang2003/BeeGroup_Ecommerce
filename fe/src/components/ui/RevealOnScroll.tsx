'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

/**
 * Lightweight scroll reveal wrapper using IntersectionObserver.
 * Fails safely to visible if IntersectionObserver is unavailable (e.g. SSR or jsdom).
 */
export default function RevealOnScroll({
  children,
  className,
  delay = 0,
  direction = 'up',
}: RevealOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If IntersectionObserver is not available or reduced motion is preferred, reveal asynchronously
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      const timer = setTimeout(() => setIsVisible(true), 0);
      return () => clearTimeout(timer);
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const timer = setTimeout(() => setIsVisible(true), 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (elementRef.current) {
              observer.unobserve(elementRef.current);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.1,
      }
    );

    const el = elementRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  const directionTransform = {
    up: 'translate-y-5',
    down: '-translate-y-5',
    left: 'translate-x-5',
    right: '-translate-x-5',
    none: '',
  }[direction];

  return (
    <div
      ref={elementRef}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'transition-all duration-500 ease-out motion-reduce:opacity-100 motion-reduce:translate-none',
        isVisible ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${directionTransform}`,
        className
      )}
    >
      {children}
    </div>
  );
}
