/**
 * Site-wide branding and contact channels.
 * TODO: Messenger link and street address are still placeholders.
 */
export const siteConfig = {
  name: 'Bee Store',
  tagline: 'Linh kiện server & workstation: CPU AMD EPYC, GPU, mainboard, tản nhiệt',
  description:
    'Bee Store cung cấp CPU AMD EPYC, GPU NVIDIA Tesla, mainboard SP3 và tản nhiệt cho home lab, máy chủ ảo hoá và workstation. Báo giá nhanh qua hotline, Zalo hoặc email.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  contact: {
    hotline: '036 6789 371',
    hotlineHref: 'tel:+84366789371',
    // Zalo uses the same number as the hotline.
    zaloHref: 'https://zalo.me/0366789371',
    messengerHref: 'https://m.me/beestore',
    email: 'sales@beegroupnas.com',
    address: 'TP. Hồ Chí Minh, Việt Nam',
  },
} as const;
