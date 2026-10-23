# Bee Store — Frontend

Storefront and admin panel for **Bee Store**, a catalog and lead-generation site for server and workstation hardware (CPU, GPU, mainboard, cooler, KVM). Visitors browse the catalog in Vietnamese, English or Chinese, sign in, keep a wishlist and send inquiries or quote requests; sales close offline. Online payment is not part of v1: the cart and checkout pages show the order but the pay button stays disabled.

The full specification (requirements, API, security, deployment) lives in the [root README](../README.md); section numbers cited in code comments (`README §6.3`, `SEC-03`, `CAT-12`, …) refer to it.

## Stack

- **Next.js 16** (App Router, Turbopack, `output: 'standalone'`) with **React 19** and strict **TypeScript**
- **Tailwind CSS 4**
- **next-intl**: locales `vi` (default), `en`, `zh`, always prefixed in the URL (`/vi/products`)
- **TanStack Query** for client data, **Zustand** for the cart and auth state
- **react-hook-form** + **zod** for forms
- **Vitest** + Testing Library (unit/component), **Playwright** (e2e)

## Project structure

```
src/
├── app/
│   ├── [locale]/            # All pages: home, products, products/[slug], category/[slug], cart, checkout,
│   │                        # about, contact, privacy, terms, auth/*, account/*, admin/*
│   ├── api/                 # Health check, on-demand revalidation (/api/revalidate)
│   ├── mock-api/v1/         # Dev-only catalog API served from the ../product folder
│   ├── storage/[...key]/    # Serves product images from ../product in mock mode
│   └── robots.ts, sitemap.ts
├── components/              # Layout (header, footer, nav), UI primitives, providers
├── features/                # account, admin, auth, cart, catalog, engagement (inquiries, wishlist, contact), legal
├── i18n/                    # next-intl routing, navigation and request config
├── messages/                # vi.json, en.json, zh.json
├── lib/
│   ├── api/                 # client.ts (browser, token refresh), server.ts (SSR/ISR reads), endpoints.ts
│   ├── catalog/             # Mock catalog reader for the ../product folder
│   └── seo.ts, utils.ts
├── config/site.ts           # Brand name, contact channels, Turnstile key
├── types/                   # DTOs mirroring the Spring Boot API
└── proxy.ts                 # Locale-prefix redirect (next-intl middleware)
test/                        # Vitest tests
tests/e2e/                   # Playwright tests
```

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:3000
```

By default the app runs in **mock mode**: the public catalog is read from the `../product` folder, so no backend is needed to browse. Auth, account, inquiries and admin need the real API.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_USE_MOCK` | mock unless `false` | `false` sends requests to the Spring Boot API |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api/v1` | API base URL used by the browser (`/api/v1` behind the proxy) |
| `INTERNAL_API_URL` | `NEXT_PUBLIC_API_URL` | API base URL for server-side rendering (Docker network) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Canonical URL for metadata, sitemap and links |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | empty (widget off) | Cloudflare Turnstile site key |
| `REVALIDATE_SECRET` | — | Shared secret the API sends to `POST /api/revalidate` |
| `CATALOG_SOURCE_DIR` | `../product` | Catalog folder read in mock mode |

`NEXT_PUBLIC_*` values are inlined at build time.

To run against a local backend, put in `.env.local`:

```env
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Serve the production build
npm run lint         # ESLint
npm run test         # Vitest
npx playwright test  # e2e
```

## Docker

The multi-stage `Dockerfile` builds the standalone server. Public env values are build args:

```bash
docker build -t beestore-fe --build-arg NEXT_PUBLIC_SITE_URL=https://example.com .
docker run -p 3000:3000 -e INTERNAL_API_URL=http://be:8080/api/v1 beestore-fe
```

For the full stack (frontend, API, database, proxy) use the `docker-compose.yml` at the repository root.
