/**
 * Spring Boot REST API client.
 * Unwraps the `{ success, data }` envelope (README §8.1). When NEXT_PUBLIC_USE_MOCK is not 'false',
 * requests go to the in-app mock API (`app/mock-api/v1`), which reads the local `product/` folder and only
 * covers the public catalog; auth, account, inquiries and admin need the real API.
 *
 * Session handling (README §6.3, SEC-03): the access token lives only in this module's memory. A 401 on a request
 * that carried a token triggers one `/auth/refresh` (shared by concurrent callers) and a single retry.
 */
import type { ApiResponse } from '@/types/api';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';
export const API_BASE_URL = USE_MOCK
  ? '/mock-api/v1'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

/** Custom header the BE requires on cookie-authenticated endpoints (SEC-06). */
const CSRF_HEADERS = { 'X-Requested-With': 'beestore' };

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public fields: FieldError[] = [],
    /** Seconds, from `Retry-After` on 429 / 423 responses. */
    public retryAfter?: number
  ) {
    super(message);
  }
}

let accessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;
const sessionLostListeners = new Set<() => void>();

export const session = {
  getToken: () => accessToken,
  setToken(token: string | null) {
    accessToken = token;
  },
  /** Called when the refresh token is gone (expired, reused, revoked): the user must log in again. */
  onLost(listener: () => void): () => void {
    sessionLostListeners.add(listener);
    return () => sessionLostListeners.delete(listener);
  },
};

/** Rotates the refresh cookie and stores the new access token; `null` when there is no valid session. */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: CSRF_HEADERS,
        });
        const body = await response.json().catch(() => null);
        accessToken = response.ok ? (body?.data?.accessToken ?? null) : null;
        return accessToken;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

function send(endpoint: string, options: RequestInit, token: string | null): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const isAuth = endpoint.startsWith('/auth/');
  if (isAuth) {
    for (const [key, value] of Object.entries(CSRF_HEADERS)) headers.set(key, value);
  }
  // CORS allows credentials only for /auth/* (SEC-07); everything else is Bearer-authenticated.
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: isAuth ? 'include' : 'same-origin',
  });
}

async function parse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const retryAfter = Number(response.headers.get('Retry-After')) || undefined;
    throw new ApiError(
      body?.message || `API Error: ${response.status} ${response.statusText}`,
      response.status,
      body?.error?.code,
      body?.error?.fields ?? [],
      retryAfter
    );
  }
  return (body as ApiResponse<T>).data;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return parse<T>(await authorized(endpoint, options));
}

/** File download: the body as a Blob plus the file name from `Content-Disposition`, when the browser exposes it. */
export async function apiBlob(endpoint: string): Promise<{ blob: Blob; filename: string | null }> {
  const response = await authorized(endpoint, {});
  if (!response.ok) return parse<never>(response);
  const match = /filename="?([^";]+)"?/.exec(response.headers.get('Content-Disposition') ?? '');
  return { blob: await response.blob(), filename: match ? match[1] : null };
}

/** Sends with the access token; on 401 refreshes once and retries. */
async function authorized(endpoint: string, options: RequestInit): Promise<Response> {
  const token = accessToken;
  let response = await send(endpoint, options, token);

  if (response.status === 401 && token && !endpoint.startsWith('/auth/')) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      response = await send(endpoint, options, fresh);
    } else {
      sessionLostListeners.forEach((listener) => listener());
    }
  }

  return response;
}

/** JSON body helper: `apiClient(url, json('POST', body))`. */
export function json(method: string, body?: unknown): RequestInit {
  return { method, body: body === undefined ? undefined : JSON.stringify(body) };
}

export { USE_MOCK };
