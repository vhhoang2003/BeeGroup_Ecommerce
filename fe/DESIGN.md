# Bee Store – design system

Source logo: `design/brand/BeeStore_Logo_02.png`. Web assets: `public/brand/logo-mark.png` (bee only, transparent),
`public/brand/logo-full.png` (bee + wordmark, transparent, for light backgrounds), `src/app/icon.png`,
`src/app/apple-icon.png`, `src/app/favicon.ico`. In the UI use `<Logo />` (`src/components/ui/Logo.tsx`):
the mark plus the wordmark set in type, `tone="light"` on ink surfaces.

## Brand reading of the logo

- **Bee in flight, crossing a hexagon**: speed, precision, a hive / network. The hexagon is the brand shape –
  use it sparingly (badges, section ornaments, image masks, loaders), never as wallpaper.
- **Orbit lines with dots**: connection across borders (sourcing from mainland China, delivery across APAC).
  Good motif for thin decorative lines, dotted dividers, a "route" in the about / delivery story.
- **Gold gradient + charcoal stripes on white**: premium, technical, confident. High contrast, few colours.
- **Wordmark**: geometric sans, "**Bee**" heavy, "Store" regular. Headings follow that rhythm: one strong word,
  one quiet word (already used by `SectionTitle`: prefix + highlight).

## Colour tokens (`src/app/globals.css`)

| Token | Hex | Use |
|---|---|---|
| `ink` (`ink-800`, `ink-700`) | #111827 | text, dark surfaces (top bar, footer, hero), primary buttons |
| `paper` | #F8FAFC | page background, quiet panels |
| `honey` (`honey-50` … `honey-800`) | #FACC15 | accent fills: CTA buttons, badges, highlights, active states |
| `amber-brand` | #F59E0B | end of the logo gradient: `bg-honey-gradient`, `text-honey-gradient` |
| `muted` | #64748B | secondary text (Tailwind `slate-*` for other greys) |
| `line` | #E2E8F0 | borders, dividers |

**Contrast rules (WCAG AA):**
- Honey is a *fill*: text on honey is always `text-ink`. Never `text-honey` on white (1.5:1).
- Accent text on light backgrounds: `text-honey-700` (#A16207, 4.9:1) or ink with a honey underline.
- On ink surfaces, honey text is fine (`text-honey` on #111827 is 10:1).
- Prices: `text-ink`, heavy weight. Brand colours of WhatsApp / Zalo / Messenger stay as they are.

## Type, shape, motion

- Font: Be Vietnam Pro (already loaded; supports Vietnamese). Headings `font-extrabold tracking-tight`.
- Radius: cards `rounded-2xl`, buttons `rounded-xl` or `rounded-full` (pills for chips / CTAs).
- Elevation: borders (`border-line`) first, soft shadows only on hover / floating elements.
- Motion: subtle and fast (150–300 ms, ease-out). Reveal on scroll, card hover lift, image zoom, button press.
  CSS / Tailwind only – no new animation dependency unless agreed. `prefers-reduced-motion` is honoured globally
  in `globals.css`; do not use motion that carries meaning.
- Responsive: mobile first; no horizontal scroll at 360 px; touch targets ≥ 40 px.

## Engineering constraints

- Next.js in this repo has breaking changes vs. older versions: read `node_modules/next/dist/docs/` before using
  an API you are unsure about (see `AGENTS.md`).
- All visible text goes through next-intl: add keys to **all three** `src/messages/{vi,en,zh}.json`
  (`test/i18n/messages.test.ts` checks parity).
- Data comes from `src/lib/api/*` and the hooks in `src/features/*/hooks` – do not change their contracts.
- Checks before handing over: `npx tsc --noEmit`, `npx eslint src`, `npx vitest run`.
- Local dev with mock data (no API needed): `npm run dev` (`.env.local` has `NEXT_PUBLIC_USE_MOCK=true`).
