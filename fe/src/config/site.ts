/**
 * Site-wide branding and contact channels.
 * TODO: replace the placeholder contact values with Bee Store's real hotline, Zalo, Messenger and address.
 */
export const siteConfig = {
  name: 'Bee Store',
  tagline: 'Linh kiện server & workstation: CPU AMD EPYC, GPU, mainboard, tản nhiệt',
  description:
    'Bee Store cung cấp CPU AMD EPYC, GPU NVIDIA Tesla, mainboard SP3 và tản nhiệt cho home lab, máy chủ ảo hoá và workstation. Báo giá nhanh qua hotline, Zalo hoặc email.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  contact: {
    hotline: '0900 000 000',
    hotlineHref: 'tel:+84900000000',
    zaloHref: 'https://zalo.me/84900000000',
    messengerHref: 'https://m.me/beestore',
    email: 'sales@beestore.vn',
    address: 'TP. Hồ Chí Minh, Việt Nam',
  },
} as const;
