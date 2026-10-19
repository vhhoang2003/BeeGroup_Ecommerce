/**
 * Spring Boot REST API client.
 * Unwraps the `{ success, data }` envelope (README §8.1). When NEXT_PUBLIC_USE_MOCK is not 'false',
 * requests go to the in-app mock API (`app/mock-api/v1`), which reads the local `product/` folder.
 */
import type { ApiResponse } from '@/types/api';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';
const API_BASE_URL = USE_MOCK
  ? '/mock-api/v1'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
  }
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  // If in browser, token can be passed via authorization header if present in memory/session
  if (typeof window !== 'undefined') {
    const sessionToken = sessionStorage.getItem('auth_token');
    if (sessionToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${sessionToken}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      body?.message || `API Error: ${response.status} ${response.statusText}`,
      response.status,
      body?.error?.code
    );
  }

  return (body as ApiResponse<T>).data;
}

export { USE_MOCK };
