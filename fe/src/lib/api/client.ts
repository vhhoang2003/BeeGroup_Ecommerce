/**
 * Spring Boot REST API client.
 * Unwraps the `{ success, data }` envelope (README §8.1). When NEXT_PUBLIC_USE_MOCK is not 'false',
 * requests go to the in-app mock API (`app/mock-api/v1`), which reads the local `product/` folder.
 *
 * Auth (README §8.3): the access token lives only in memory and is sent as a Bearer header. The refresh token is an
 * httpOnly cookie scoped to `/api/v1/auth`, so only auth calls send credentials (the API's CORS allows cookies there
 * only). A 401 on any other call triggers one refresh and a retry.
 */
import type { ApiErrorResponse, ApiResponse } from '@/types/api';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';
const API_BASE_URL = USE_MOCK
  ? '/mock-api/v1'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

/** Custom header the API requires on cookie-authenticated endpoints (SEC-06). */
const CSRF_HEADER = { 'X-Requested-With': 'beestore' };

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public fields: { field: string; message: string }[] = []
  ) {
    super(message);
  }
}

let accessToken: string | null = null;
let refreshing: Promise<string | null> | null = null;
let onSessionEnded: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

/** Called when a refresh fails mid-session, so the auth store can drop the user. */
export function setSessionEndedListener(listener: (() => void) | null) {
  onSessionEnded = listener;
}

/** Trades the refresh cookie for a new access token; concurrent callers share one request. Null when there is no session. */
export function refreshAccessToken(): Promise<string | null> {
  refreshing ??= fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: CSRF_HEADER,
  })
    .then(async (response) => {
      const body = await response.json().catch(() => null);
      accessToken = response.ok ? ((body as ApiResponse<{ accessToken: string }>).data.accessToken ?? null) : null;
      return accessToken;
    })
    .catch(() => {
      accessToken = null;
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function send(endpoint: string, options: RequestInit): Promise<Response> {
  const headers = new Headers(options.headers);
  // FormData sets its own multipart boundary.
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  const isAuthCall = endpoint.startsWith('/auth/');
  if (isAuthCall) {
    Object.entries(CSRF_HEADER).forEach(([name, value]) => headers.set(name, value));
  }

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: isAuthCall ? 'include' : options.credentials,
  });
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let response = await send(endpoint, options);

  if (response.status === 401 && accessToken && !endpoint.startsWith('/auth/')) {
    if (await refreshAccessToken()) {
      response = await send(endpoint, options);
    } else {
      onSessionEnded?.();
    }
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = body as ApiErrorResponse | null;
    throw new ApiError(
      error?.message || `API Error: ${response.status} ${response.statusText}`,
      response.status,
      error?.error?.code,
      error?.error?.fields ?? []
    );
  }

  // 204 No Content (deletes, logout) has no envelope.
  return (body as ApiResponse<T> | null)?.data as T;
}

export { USE_MOCK };
