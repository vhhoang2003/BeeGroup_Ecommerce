'use client';

import { create } from 'zustand';
import type { User } from '@/types/user';
import { refreshAccessToken, session } from '@/lib/api/client';
import { AuthApi, MeApi } from '@/lib/api/endpoints';

/**
 * `unknown` until the one-time session restore on app load has finished (README §6.3), so guarded pages do not
 * bounce a logged-in user to the login page while the refresh is still running.
 */
export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  /** Restores the session from the refresh cookie once per page load. */
  init: () => Promise<void>;
  /** Throws `ApiError` (INVALID_CREDENTIALS, EMAIL_NOT_VERIFIED, ACCOUNT_LOCKED, RATE_LIMITED). */
  login: (email: string, password: string, rememberMe: boolean) => Promise<User>;
  logout: () => Promise<void>;
  /** Drops the local session without calling the API (session lost, account deleted). */
  clear: () => void;
  setUser: (user: User) => void;
}

let initPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  // Visitors start logged out; the access token itself is kept in `session`, in memory only (SEC-03).
  user: null,
  status: 'unknown',
  isAuthenticated: false,

  init: () => {
    if (!initPromise) {
      initPromise = (async () => {
        const token = await refreshAccessToken();
        if (!token) {
          set({ user: null, status: 'anonymous', isAuthenticated: false });
          return;
        }
        try {
          get().setUser(await MeApi.get());
        } catch {
          get().clear();
        }
      })();
    }
    return initPromise;
  },

  login: async (email, password, rememberMe) => {
    const result = await AuthApi.login(email, password, rememberMe);
    session.setToken(result.accessToken);
    get().setUser(result.user);
    return result.user;
  },

  logout: async () => {
    try {
      await AuthApi.logout();
    } finally {
      get().clear();
    }
  },

  clear: () => {
    session.setToken(null);
    set({ user: null, status: 'anonymous', isAuthenticated: false });
  },

  setUser: (user) => set({ user, status: 'authenticated', isAuthenticated: true }),
}));

/** Test helper: lets `init()` run again. */
export function resetAuthInit() {
  initPromise = null;
}

if (typeof window !== 'undefined') {
  session.onLost(() => useAuthStore.getState().clear());
}
