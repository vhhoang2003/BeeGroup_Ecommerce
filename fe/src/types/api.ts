export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    fields?: { field: string; message: string }[];
    traceId?: string;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
