import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { config } from '@/proxy';

// Compile the matcher exactly as Next.js does, since its compiler treats escapes differently from a plain RegExp.
const require = createRequire(import.meta.url);
const { getMiddlewareMatchers } = require('next/dist/build/analysis/get-page-static-info');
const [matcher] = getMiddlewareMatchers(config.matcher, {});
const runsOn = (path: string) => new RegExp(matcher.regexp).test(path);

describe('proxy matcher', () => {
  it.each(['/', '/products', '/auth/verify-email', '/admin/inquiries', '/vi/products/amd-epyc-7402'])(
    'runs the locale redirect on %s',
    (path) => expect(runsOn(path)).toBe(true)
  );

  it.each(['/api/revalidate', '/api/health', '/mock-api/v1/products', '/storage/CPU/a.jpg', '/sitemap.xml', '/robots.txt', '/favicon.ico', '/_next/static/chunk.js'])(
    'skips %s',
    (path) => expect(runsOn(path)).toBe(false)
  );
});
