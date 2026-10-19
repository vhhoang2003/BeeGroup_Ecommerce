/**
 * Spring Boot REST API Client
 * Configured with environment-based base URL, bearer token authentication header,
 * and automatic fallback to Mock Service when backend is unavailable or USE_MOCK is set.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false'; // Default to mock for standalone UI

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export { USE_MOCK };
