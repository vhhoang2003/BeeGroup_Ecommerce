import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

/** Origin of the Spring Boot API when it is not same-origin (local dev: http://localhost:8080). */
function apiOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? '').origin;
  } catch {
    return ''; // relative URL such as /api/v1 behind the Caddy proxy
  }
}

const TURNSTILE = 'https://challenges.cloudflare.com';
const api = apiOrigin();

/**
 * SEC-10. No nonces: they would force every page to render dynamically and lose ISR, so inline scripts are
 * allowed (Next.js "Without Nonces" setup) while everything else is locked to this origin, the API and Turnstile.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} ${TURNSTILE}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${api}`.trim(),
  "font-src 'self'",
  `connect-src 'self' ${api} ${TURNSTILE}${isDev ? ' ws:' : ''}`.trim(),
  `frame-src ${TURNSTILE}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (README §12.4).
  output: 'standalone',
  // No `X-Powered-By: Next.js` (ZAP baseline 10037).
  poweredByHeader: false,
  turbopack: {
    // What `createNextIntlPlugin()` would add. The plugin itself is not used because loading it pulls in
    // @swc/core for its message extractor, whose native binding refuses to load on some Windows setups.
    resolveAlias: {
      'next-intl/config': './src/i18n/request.ts',
    },
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
