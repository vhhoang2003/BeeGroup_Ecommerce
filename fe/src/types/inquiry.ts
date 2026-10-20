import type { ContactChannel } from './user';
import type { Locale } from './product';

export type InquiryStatus = 'NEW' | 'CONTACTED' | 'QUOTED' | 'CLOSED_WON' | 'CLOSED_LOST' | 'SPAM';
export type InquiryType = 'PRODUCT' | 'GENERAL';

export const INQUIRY_STATUSES: InquiryStatus[] = ['NEW', 'CONTACTED', 'QUOTED', 'CLOSED_WON', 'CLOSED_LOST', 'SPAM'];

/** Name, price and slug of the product at the time of the request. */
export interface ProductSnapshot {
  name: string;
  price: number | null;
  slug: string;
}

export interface ProductInquiryRequest {
  productId: string;
  quantity: number;
  message?: string;
  preferredContact?: ContactChannel;
  phone?: string;
  fullName?: string;
  email?: string;
  captchaToken?: string;
  locale: Locale;
}

export interface ContactRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  preferredContact?: ContactChannel;
  subject: string;
  message: string;
  captchaToken?: string;
  locale: Locale;
}

export interface InquiryCreated {
  inquiryCode: string;
}

export interface StatusChange {
  fromStatus: InquiryStatus | null;
  toStatus: InquiryStatus;
  at: string;
}

/** `GET /me/inquiries` item (ENG-05). */
export interface MyInquiry {
  code: string;
  type: InquiryType;
  status: InquiryStatus;
  product: ProductSnapshot | null;
  quantity: number;
  subject: string | null;
  message: string | null;
  preferredContact: ContactChannel | null;
  createdAt: string;
  history: StatusChange[];
}
