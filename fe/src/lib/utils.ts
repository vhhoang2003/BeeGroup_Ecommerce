import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { StockStatus } from '@/types/product';

/**
 * True for absolute URLs on a loopback host (the API in local development). Next's image optimizer refuses to fetch
 * those, so such images are rendered unoptimized.
 */
export function isLoopbackUrl(src: string): boolean {
  if (!/^https?:\/\//.test(src)) return false;
  const host = new URL(src).hostname;
  return host === 'localhost' || host === '[::1]' || host.startsWith('127.');
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** `3.380.000 ₫`, or "Liên hệ" when the price is not published (CAT-07). */
export function formatPrice(amount: number | null): string {
  if (amount === null) return 'Liên hệ';
  return `${amount.toLocaleString('vi-VN')} ₫`;
}

export const stockStatusLabel: Record<StockStatus, string> = {
  IN_STOCK: 'Còn hàng',
  LOW_STOCK: 'Sắp hết hàng',
  OUT_OF_STOCK: 'Hết hàng',
  PRE_ORDER: 'Đặt trước',
};
