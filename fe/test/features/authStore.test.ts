import { describe, it, expect, beforeEach } from 'vitest';
import { authErrorMessage, useAuthStore } from '@/features/auth/store/useAuthStore';
import { ApiError } from '@/lib/api/client';

const initialState = useAuthStore.getState();

// NEXT_PUBLIC_USE_MOCK is unset in tests, so the store runs its offline demo login.
describe('useAuthStore (mock mode)', () => {
  beforeEach(() => {
    useAuthStore.setState(initialState, true);
  });

  it('starts logged out, with no user, and needs no session restore', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.initialized).toBe(true);
  });

  it('is authenticated after login and logged out again after logout', async () => {
    const result = await useAuthStore.getState().login('khach@example.com', 'Beestore2026');
    expect(result.ok).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe('khach@example.com');
    expect(useAuthStore.getState().user?.role).toBe('CUSTOMER');

    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('rejects a too-short password with a message', async () => {
    const result = await useAuthStore.getState().login('khach@example.com', '12');
    expect(result.ok).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('authErrorMessage', () => {
  it('maps known API error codes to Vietnamese messages', () => {
    expect(authErrorMessage(new ApiError('Bad credentials', 401, 'INVALID_CREDENTIALS'))).toBe(
      'Email hoặc mật khẩu không đúng.'
    );
  });

  it('falls back to field messages, then to the API message', () => {
    const withFields = new ApiError('Validation failed', 400, 'VALIDATION_ERROR', [
      { field: 'password', message: 'Password must be 8-72 characters' },
    ]);
    expect(authErrorMessage(withFields)).toBe('Password must be 8-72 characters');
    expect(authErrorMessage(new ApiError('Boom', 500, 'INTERNAL_ERROR'))).toBe('Boom');
  });

  it('reports network failures', () => {
    expect(authErrorMessage(new TypeError('Failed to fetch'))).toContain('Không kết nối');
  });
});
