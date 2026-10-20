import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * Adds the locale prefix (`/products` -> `/vi/products`) using the NEXT_LOCALE cookie or Accept-Language. Links in
 * emails from the API (`/auth/verify-email?token=…`, `/admin/inquiries`) have no prefix and rely on this redirect.
 */
export default createMiddleware(routing);

export const config = {
  // Everything except API routes, the dev mock API, image storage, Next internals and files with an extension.
  // `[.]` instead of `\.`: Next's matcher compiler drops the backslash, which would match every path.
  matcher: ['/((?!api|mock-api|storage|_next|_vercel|.*[.].*).*)'],
};
