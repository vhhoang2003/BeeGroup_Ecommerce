import type { Locale } from './product';

export type Role = 'CUSTOMER' | 'ADMIN';
export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'LOCKED' | 'DELETED';
export type ContactChannel = 'PHONE' | 'ZALO' | 'EMAIL' | 'MESSENGER';

export const CONTACT_CHANNELS: ContactChannel[] = ['PHONE', 'ZALO', 'EMAIL', 'MESSENGER'];

/** `UserDto` returned by `/me`, `/auth/login` and `/admin/users`. */
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  preferredLocale: Locale | null;
  preferredContact: ContactChannel | null;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  phone?: string;
  acceptTerms: boolean;
  locale: Locale;
}

export interface UpdateProfileRequest {
  fullName?: string;
  /** E.164; an empty string clears it. */
  phone?: string;
  preferredLocale?: Locale;
  preferredContact?: ContactChannel;
}
