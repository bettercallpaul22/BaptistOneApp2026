export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: boolean;
  success: boolean;
}

export interface ApiErrorPayload {
  message: string;
  status?: number;
  errorCode?: string;
  errors?: Record<string, string[]>;
}
