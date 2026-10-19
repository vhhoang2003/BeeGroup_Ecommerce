import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

type ClientModule = typeof import('@/lib/api/client');

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// The client reads NEXT_PUBLIC_USE_MOCK at import time, so each test loads a fresh copy in real-API mode.
async function loadClient(): Promise<ClientModule> {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_USE_MOCK', 'false');
  vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test/api/v1');
  return import('@/lib/api/client');
}

describe('apiClient (real API)', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('sends the bearer token and unwraps the envelope', async () => {
    const client = await loadClient();
    client.setAccessToken('t1');
    fetchMock.mockResolvedValueOnce(json(200, { success: true, data: { ok: 1 } }));

    await expect(client.apiClient('/me')).resolves.toEqual({ ok: 1 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/v1/me');
    expect(new Headers(init!.headers).get('Authorization')).toBe('Bearer t1');
    expect(init!.credentials).toBeUndefined();
  });

  it('refreshes once on 401 and retries with the new token', async () => {
    const client = await loadClient();
    client.setAccessToken('expired');
    fetchMock
      .mockResolvedValueOnce(json(401, { success: false, message: 'expired', error: { code: 'TOKEN_EXPIRED' } }))
      .mockResolvedValueOnce(json(200, { success: true, data: { accessToken: 'fresh', expiresIn: 900 } }))
      .mockResolvedValueOnce(json(200, { success: true, data: 'retried' }));

    await expect(client.apiClient('/admin/products')).resolves.toBe('retried');

    const [refreshUrl, refreshInit] = fetchMock.mock.calls[1];
    expect(refreshUrl).toBe('http://api.test/api/v1/auth/refresh');
    expect(refreshInit!.credentials).toBe('include');
    expect(new Headers(refreshInit!.headers).get('X-Requested-With')).toBe('beestore');
    expect(new Headers(fetchMock.mock.calls[2][1]!.headers).get('Authorization')).toBe('Bearer fresh');
  });

  it('ends the session when the refresh fails', async () => {
    const client = await loadClient();
    const ended = vi.fn();
    client.setSessionEndedListener(ended);
    client.setAccessToken('expired');
    fetchMock
      .mockResolvedValueOnce(json(401, { success: false, message: 'expired', error: { code: 'TOKEN_EXPIRED' } }))
      .mockResolvedValueOnce(json(401, { success: false, message: 'no', error: { code: 'REFRESH_TOKEN_INVALID' } }));

    await expect(client.apiClient('/admin/products')).rejects.toMatchObject({ status: 401, code: 'TOKEN_EXPIRED' });
    expect(ended).toHaveBeenCalledOnce();
    expect(client.getAccessToken()).toBeNull();
  });

  it('exposes field errors, leaves the multipart boundary to the browser and accepts 204', async () => {
    const client = await loadClient();
    fetchMock.mockResolvedValueOnce(
      json(400, {
        success: false,
        message: 'Validation failed',
        error: { code: 'VALIDATION_ERROR', fields: [{ field: 'slug', message: 'invalid' }] },
      })
    );
    await expect(client.apiClient('/admin/products', { method: 'POST', body: '{}' })).rejects.toMatchObject({
      fields: [{ field: 'slug', message: 'invalid' }],
    });

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 201 }));
    await client.apiClient('/admin/products/p1/images', { method: 'POST', body: new FormData() });
    expect(new Headers(fetchMock.mock.calls[1][1]!.headers).has('Content-Type')).toBe(false);

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(client.apiClient('/admin/products/p1', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});
