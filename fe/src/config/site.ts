/**
 * Site-wide branding and contact channels. Localized texts (tagline, description, address) live in
 * `src/messages/*.json` under `site`.
 * TODO: Messenger link and street address are still placeholders.
 */
export const siteConfig = {
  name: 'Bee Store',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  contact: {
    // International format: customers call from across Southeast Asia / APAC.
    hotline: '+84 36 6789 371',
    hotlineHref: 'tel:+84366789371',
    // Zalo and WhatsApp use the same number as the hotline.
    zaloHref: 'https://zalo.me/0366789371',
    whatsappHref: 'https://wa.me/84366789371',
    messengerHref: 'https://m.me/beestore',
    email: 'sales@beegroupnas.com',
    mapHref: 'https://maps.google.com/?q=Ho+Chi+Minh+City',
  },
  /** Cloudflare Turnstile site key; empty disables the widget (the API skips the check outside production). */
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
} as const;
