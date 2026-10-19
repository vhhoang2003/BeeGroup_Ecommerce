import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { StockStatus } from '@/types/product';

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
