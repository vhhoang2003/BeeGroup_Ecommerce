import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// The real API, not the in-app mock (which has no auth endpoints).
vi.stubEnv('NEXT_PUBLIC_USE_MOCK', 'false');
vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test/api/v1');

const { useAuthStore, resetAuthInit } = await import('@/features/auth/store/useAuthStore');
const { apiClient, session, ApiError } = await import('@/lib/api/client');

const user = {
  id: 'u-1',
  email: 'khach@example.com',
  fullName: 'Nguyễn Văn Khách',
  phone: null,
  role: 'CUSTOMER',
  status: 'ACTIVE',
  preferredLocale: 'vi',
  preferredContact: null,
  emailVerifiedAt: '2026-10-01T00:00:00Z',
  lastLoginAt: null,
  createdAt: '2026-10-01T00:00:00Z',
};

function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify({ success: true, data, timestamp: '' }), { status });
}

function fail(status: number, code: string) {
  return new Response(JSON.stringify({ success: false, message: code, error: { code } }), { status });
}

const initial = useAuthStore.getState();
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  useAuthStore.setState(initial, true);
  session.setToken(null);
  resetAuthInit();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('useAuthStore', () => {
  it('starts with an unknown session and no user', () => {
    const state = useAuthStore.getState();
    expect(state.status).toBe('unknown');
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('restores the session on load from the refresh cookie (README §6.3)', async () => {
    fetchMock
      .mockResolvedValueOnce(ok({ accessToken: 'access-1', expiresIn: 900 }))
      .mockResolvedValueOnce(ok(user));

    await useAuthStore.getState().init();

    const [refreshUrl, refreshInit] = fetchMock.mock.calls[0];
    expect(refreshUrl).toBe('http://api.test/api/v1/auth/refresh');
    expect(refreshInit.credentials).toBe('include');
    expect(new Headers(refreshInit.headers).get('X-Requested-With')).toBe('beestore');
    expect(new Headers(fetchMock.mock.calls[1][1].headers).get('Authorization')).toBe('Bearer access-1');
    expect(useAuthStore.getState().user?.email).toBe('khach@example.com');
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('becomes anonymous when there is no refresh cookie', async () => {
    fetchMock.mockResolvedValueOnce(fail(401, 'REFRESH_TOKEN_INVALID'));
    await useAuthStore.getState().init();
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('keeps the access token in memory only and clears it on logout', async () => {
    fetchMock.mockResolvedValueOnce(ok({ accessToken: 'access-2', expiresIn: 900, user }));
    await useAuthStore.getState().login('khach@example.com', 'Beestore2026', true);

    expect(session.getToken()).toBe('access-2');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      email: 'khach@example.com',
      password: 'Beestore2026',
      rememberMe: true,
    });
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await useAuthStore.getState().logout();
    expect(session.getToken()).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('surfaces EMAIL_NOT_VERIFIED from the API', async () => {
    fetchMock.mockResolvedValueOnce(fail(403, 'EMAIL_NOT_VERIFIED'));
    await expect(useAuthStore.getState().login('a@b.vn', 'x', false)).rejects.toMatchObject({
      status: 403,
      code: 'EMAIL_NOT_VERIFIED',
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('apiClient refresh interceptor', () => {
  it('shares one refresh between concurrent 401s and retries each request once', async () => {
    session.setToken('expired');
    let refreshCalls = 0;
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) {
        refreshCalls++;
        await new Promise((r) => setTimeout(r, 10));
        return ok({ accessToken: 'fresh', expiresIn: 900 });
      }
      const auth = new Headers(init.headers).get('Authorization');
      return auth === 'Bearer fresh' ? ok({ url }) : fail(401, 'TOKEN_EXPIRED');
    });

    const results = await Promise.all([apiClient('/me'), apiClient('/me/wishlist'), apiClient('/me/inquiries')]);

    expect(refreshCalls).toBe(1);
    expect(results).toHaveLength(3);
    expect(session.getToken()).toBe('fresh');
  });

  it('drops the session when the refresh token was reused or revoked', async () => {
    useAuthStore.setState({ user: user as never, status: 'authenticated', isAuthenticated: true });
    session.setToken('expired');
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith('/auth/refresh') ? fail(401, 'REFRESH_TOKEN_REUSED') : fail(401, 'TOKEN_EXPIRED')
    );

    await expect(apiClient('/me')).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(session.getToken()).toBeNull();
  });

  it('does not try to refresh for anonymous requests', async () => {
    fetchMock.mockResolvedValueOnce(fail(401, 'UNAUTHORIZED'));
    await expect(apiClient('/me')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
