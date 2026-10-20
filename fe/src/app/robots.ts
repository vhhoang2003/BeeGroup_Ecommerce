import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { routing } from '@/i18n/routing';

const PRIVATE = ['/account', '/admin', '/auth'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: routing.locales.flatMap((l) => PRIVATE.map((p) => `/${l}${p}`)),
    },
    sitemap: new URL('/sitemap.xml', siteConfig.url).toString(),
  };
}
