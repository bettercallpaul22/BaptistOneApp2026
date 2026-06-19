export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiErrorPayload {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}
