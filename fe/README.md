# MegaMart — Production-Ready E-Commerce Frontend

MegaMart is a modern, high-performance e-commerce storefront recreating the Figma reference design with pixel-level fidelity. Built with **Next.js 16 (App Router)**, **TypeScript (Strict Mode)**, **Tailwind CSS**, **TanStack Query**, and **Zustand**, it includes complete standalone mock adapters and is architected to seamlessly pair with a **Java Spring Boot REST API**.

---

## 🎨 Visual Source of Truth & Design Fidelity

The design matches the reference mockup:
- **Top Utility Bar:** Delivery postal code (`423651`), order tracking, and active offers.
- **Header:** MegaMart logo, debounced live autocomplete search bar, user sign-in/account link, and real-time cart indicator.
- **Category Navigation Pills:** Horizontal pill navigation with active department (`Groceries`) highlighted in `#008ECC`.
- **Hero Carousel Banner:** High-contrast navy (`#212844`) banner featuring the smart wearable, "UP to 80% OFF" badge, auto-slide and previous/next circular floating controls.
- **Smartphone Deals:** Section header with signature cyan underline accent, 5 responsive product cards, discount badges (`56% OFF`), INR currency (`₹`), strikethrough original prices, and green savings highlights (`Save - ₹...`).
- **Top Categories:** 7 circular department shortcuts (`Mobile`, `Cosmetics`, `Electronics`, `Furniture`, `Watches`, `Decor`, `Accessories`).
- **Top Electronics Brands:** 3 promotional banners for **Apple (iPhone)**, **realme**, and **Xiaomi** with pagination indicators.
- **Daily Essentials:** 6 grocery cards (`Daily Essentials`, `Vegitables`, `Fruits`, `Strowberry`, `Mango`, `Cherry`) with "UP to 50% OFF".
- **Footer:** Cyan-blue (`#008ECC`) footer with WhatsApp/call contact details, App Store & Google Play badges, category tree, customer service policies, and copyright.

---

## 🏗️ Architecture & Project Structure

```
src/
├── app/
│   ├── layout.tsx             # Root layout with QueryProvider and MainLayout
│   ├── page.tsx               # Homepage matching reference mockup
│   ├── products/
│   │   ├── page.tsx           # Product catalog with faceted filtering & sorting
│   │   └── [id]/page.tsx      # Product Detail Page (PDP) with specs & Buy Now
│   ├── category/[slug]/       # Department category listings
│   ├── cart/page.tsx          # Full cart with promo codes & price breakdown
│   ├── checkout/
│   │   ├── page.tsx           # Checkout with Zod validation (COD, Card, UPI)
│   │   └── success/page.tsx   # Order confirmation & delivery estimate
│   ├── auth/
│   │   ├── login/page.tsx     # Secure session sign-in
│   │   └── register/page.tsx  # User account registration
│   └── account/page.tsx       # Profile, address book, and order tracking
├── components/
│   ├── layout/                # TopUtilityBar, Header, CategoryNav, Footer, MobileNav
│   ├── ui/                    # Reusable SectionTitle, Buttons, Badges
│   └── providers/             # TanStack Query Client Provider
├── features/
│   ├── catalog/               # HeroBanner, SmartphoneDeals, BrandBanners, Search
│   ├── cart/                  # Zustand store (persisted in localStorage) & CartDrawer
│   ├── auth/                  # Zustand auth state & session storage
│   └── checkout/              # Zod schemas & order forms
├── lib/
│   ├── api/                   # Spring Boot REST client abstraction
│   ├── mocks/                 # Realistic mock database & async service
│   └── utils.ts               # Currency formatting (₹ INR), styling utilities
└── types/                     # Strongly-typed DTOs mirroring Spring Boot entities
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v20+` or `v24+`
- **npm**: `v10+` or `v11+`

### 2. Installation
```bash
npm install
```

### 3. Running Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Running Production Build
```bash
npm run build
npm run start
```

---

## ☕ Spring Boot REST Backend Integration

The frontend uses an abstraction layer located in `src/lib/api/client.ts` and `src/lib/api/endpoints.ts`.

### Switching from Mock to Live Spring Boot:
Set the environment variable in `.env.local`:
```env
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### Expected Spring Boot REST Endpoints:
- `GET /api/v1/products/deals/smartphones` -> Returns `Product[]`
- `GET /api/v1/categories` -> Returns `Category[]`
- `GET /api/v1/promotions/brands` -> Returns `BrandBanner[]`
- `GET /api/v1/products?page=0&size=12&category=...&brand=...&sort=...` -> Returns `PaginatedResponse<Product>`
- `GET /api/v1/products/{idOrSlug}` -> Returns `Product`
- `GET /api/v1/products/suggestions?q=...` -> Returns `Product[]`
- `POST /api/v1/orders` -> Accepts `CheckoutFormData` and creates order

---

## 🧪 Testing

### Running Component and Unit Tests (Vitest)
```bash
npm run test
```
Includes:
- SectionTitle header rendering and link checks
- ProductCard discount calculation and Add-to-Cart interactions
- Zustand Cart Store price calculations and quantity mutation tests

### Running E2E Tests (Playwright)
```bash
npx playwright test
```

---

## 🐳 Docker Deployment

To build and run the production container:
```bash
docker build -t megamart-frontend .
docker run -p 3000:3000 megamart-frontend
```
