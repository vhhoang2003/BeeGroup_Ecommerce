import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

const initialState = useAuthStore.getState();

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState(initialState, true);
    sessionStorage.clear();
  });

  it('starts logged out, with no user or token', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('is authenticated after login and logged out again after logout', async () => {
    const ok = await useAuthStore.getState().login('khach@example.com', 'Beestore2026');
    expect(ok).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe('khach@example.com');

    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
