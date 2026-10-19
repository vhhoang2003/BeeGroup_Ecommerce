import type { ApiErrorResponse, ApiResponse } from '@/types/api';

/** Wraps data in the README §8.1 response envelope. */
export function ok<T>(data: T): Response {
  const body: ApiResponse<T> = { success: true, message: null, data, timestamp: new Date().toISOString() };
  return Response.json(body);
}

export function notFound(message = 'Resource not found'): Response {
  const body: ApiErrorResponse = {
    success: false,
    message,
    error: { code: 'RESOURCE_NOT_FOUND' },
    timestamp: new Date().toISOString(),
  };
  return Response.json(body, { status: 404 });
}
