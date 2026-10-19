export type Role = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatar?: string;
}

/** `UserDto` of the API (README §8.3). */
export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  status: string;
  preferredLocale: string | null;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: UserDto;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  acceptTerms: boolean;
}
