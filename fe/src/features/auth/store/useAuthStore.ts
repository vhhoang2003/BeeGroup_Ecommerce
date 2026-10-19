'use client';

import { create } from 'zustand';
import type { RegisterInput, User } from '@/types/user';
import { ApiError, USE_MOCK, refreshAccessToken, setAccessToken, setSessionEndedListener } from '@/lib/api/client';
import { AuthApi, toUser } from '@/lib/api/auth';

export type AuthResult =
  | { ok: true; user: User | null; pendingVerification?: boolean }
  | { ok: false; error: string; code?: string };

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** True once the session restore on page load has finished, so guards do not redirect too early. */
  initialized: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  EMAIL_NOT_VERIFIED: 'Email chưa được xác thực. Vui lòng mở liên kết trong email chúng tôi đã gửi.',
  ACCOUNT_LOCKED: 'Tài khoản đang bị khoá tạm thời. Vui lòng thử lại sau.',
  RATE_LIMITED: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
  TOKEN_INVALID_OR_EXPIRED: 'Liên kết không hợp lệ hoặc đã hết hạn.',
  EMAIL_ALREADY_EXISTS: 'Email này đã được đăng ký.',
};

/** User-facing message for a failed auth call. */
export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code && ERROR_MESSAGES[error.code]) return ERROR_MESSAGES[error.code];
    if (error.fields.length > 0) return error.fields.map((f) => f.message).join('. ');
    return error.message;
  }
  return 'Không kết nối được máy chủ. Vui lòng thử lại.';
}

/** Offline demo (NEXT_PUBLIC_USE_MOCK): any email with a 4+ character password signs in as a customer. */
async function mockSignIn(name: string, email: string, password: string): Promise<AuthResult> {
  await new Promise((res) => setTimeout(res, 400));
  if (password.length < 4) {
    return { ok: false, error: 'Mật khẩu cần ít nhất 4 ký tự.' };
  }
  return { ok: true, user: { id: `usr-${Date.now()}`, name, email, role: 'CUSTOMER' } };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Visitors start logged out; a session only exists after login / register (README §17.1).
  user: null,
  isAuthenticated: false,
  isLoading: false,
  initialized: USE_MOCK,

  login: async (email, password, rememberMe = false) => {
    set({ isLoading: true });
    let result: AuthResult;
    if (USE_MOCK) {
      result = await mockSignIn(email.split('@')[0], email, password);
    } else {
      try {
        const res = await AuthApi.login(email, password, rememberMe);
        setAccessToken(res.accessToken);
        result = { ok: true, user: toUser(res.user) };
      } catch (error) {
        result = { ok: false, error: authErrorMessage(error), code: error instanceof ApiError ? error.code : undefined };
      }
    }
    set(
      result.ok
        ? { user: result.user, isAuthenticated: true, isLoading: false }
        : { isLoading: false }
    );
    return result;
  },

  register: async (input) => {
    set({ isLoading: true });
    if (USE_MOCK) {
      const result = await mockSignIn(input.fullName, input.email, input.password);
      set(result.ok ? { user: result.user, isAuthenticated: true, isLoading: false } : { isLoading: false });
      return result;
    }
    try {
      await AuthApi.register(input);
      set({ isLoading: false });
      return { ok: true, user: null, pendingVerification: true };
    } catch (error) {
      set({ isLoading: false });
      return { ok: false, error: authErrorMessage(error) };
    }
  },

  logout: async () => {
    if (!USE_MOCK) {
      // Best effort: the local session ends even if the server cannot be reached.
      await AuthApi.logout().catch(() => undefined);
    }
    setAccessToken(null);
    set({ user: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    if (USE_MOCK || get().initialized) return;
    try {
      if (await refreshAccessToken()) {
        const user = toUser(await AuthApi.me());
        set({ user, isAuthenticated: true });
      }
    } catch {
      setAccessToken(null);
    } finally {
      set({ initialized: true });
    }
  },

  updateUser: (data) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },
}));

setSessionEndedListener(() => {
  setAccessToken(null);
  useAuthStore.setState({ user: null, isAuthenticated: false });
});
