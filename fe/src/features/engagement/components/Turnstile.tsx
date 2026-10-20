'use client';

import React, { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { siteConfig } from '@/config/site';

/** Minimal typing of the Cloudflare Turnstile browser API (explicit rendering). */
interface TurnstileApi {
  render(
    el: HTMLElement,
    options: {
      sitekey: string;
      language?: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    }
  ): string;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Turnstile failed to load'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

/** True when guests must solve a captcha before submitting (ENG-02). */
export const captchaEnabled = siteConfig.turnstileSiteKey !== '';

/**
 * Cloudflare Turnstile widget for guest forms (ENG-02). Renders nothing when no site key is configured, which the
 * API accepts outside production. Change `key` on the element to get a fresh challenge after a failed submit.
 */
export default function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!captchaEnabled || !ref.current) return;
    let widgetId: string | null = null;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId = window.turnstile.render(ref.current, {
          sitekey: siteConfig.turnstileSiteKey,
          language: locale === 'zh' ? 'zh-cn' : locale,
          callback: (token) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        });
      })
      .catch(() => onTokenRef.current(null));
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [locale]);

  if (!captchaEnabled) return null;
  return <div ref={ref} className="min-h-[65px]" />;
}
