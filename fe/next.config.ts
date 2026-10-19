import type { NextConfig } from 'next';

/**
 * Product images uploaded through the API are served under `/uploads` from PUBLIC_ASSET_BASE_URL: the site's own
 * domain in production (docker-compose.prod.yml), the API origin in development. Both URLs are build-time env vars,
 * so next/image accepts exactly those hosts.
 */
function uploadPatterns(): URL[] {
  return [process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_API_URL]
    .filter((value): value is string => Boolean(value && /^https?:\/\//.test(value)))
    .map((value) => new URL('/uploads/**', value));
}

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (README §12.4).
  output: 'standalone',
  images: {
    remotePatterns: uploadPatterns(),
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
