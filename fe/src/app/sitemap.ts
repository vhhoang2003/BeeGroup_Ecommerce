import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { routing } from '@/i18n/routing';
import { fetchAllProductSlugs, fetchCategories } from '@/lib/api/server';
import { localizedPath } from '@/lib/seo';

// Rendered per request (API data is still cached by fetch for 5 minutes): prerendering at `next build` would bake in
// a sitemap without products, since the API is not reachable while the Docker image builds.
export const dynamic = 'force-dynamic';

function entry(path: string, priority: number): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, new URL(localizedPath(l, path), siteConfig.url).toString()])
  );
  return {
    url: new URL(localizedPath(routing.defaultLocale, path), siteConfig.url).toString(),
    priority,
    alternates: { languages },
  };
}

/** One URL per page with `hreflang` alternates for vi / en / zh (CAT-12). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = [entry('/', 1), entry('/products', 0.8), entry('/contact', 0.5), entry('/privacy', 0.2), entry('/terms', 0.2)];
  try {
    const [categories, slugs] = await Promise.all([fetchCategories(routing.defaultLocale), fetchAllProductSlugs()]);
    return [
      ...pages,
      ...categories.map((c) => entry(`/category/${c.slug}`, 0.7)),
      ...slugs.map((slug) => entry(`/products/${slug}`, 0.9)),
    ];
  } catch {
    return pages;
  }
}
