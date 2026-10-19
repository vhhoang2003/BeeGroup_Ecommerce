import { apiClient } from './client';
import type { LoginResponse, RegisterInput, User, UserDto } from '@/types/user';

export function toUser(dto: UserDto): User {
  return {
    id: dto.id,
    name: dto.fullName,
    email: dto.email,
    role: dto.role,
    phone: dto.phone ?? undefined,
  };
}

/** `/api/v1/auth/*` and `/api/v1/me` (README §8.3). */
export const AuthApi = {
  login(email: string, password: string, rememberMe: boolean) {
    return apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });
  },

  /** The account stays unusable until the emailed link is opened (AUTH-01). */
  register(input: RegisterInput) {
    return apiClient<void>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...input, locale: 'vi' }),
    });
  },

  logout() {
    return apiClient<void>('/auth/logout', { method: 'POST' });
  },

  me() {
    return apiClient<UserDto>('/me');
  },
};
