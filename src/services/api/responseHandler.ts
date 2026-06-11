import type { AxiosError } from 'axios';
import type { ApiErrorPayload } from '@/types/api';

export const toApiError = (error: unknown): ApiErrorPayload => {
  const axiosError = error as AxiosError<ApiErrorPayload>;

  if (axiosError.response?.data?.message) {
    return {
      ...axiosError.response.data,
      status: axiosError.response.status,
    };
  }

  if (axiosError.message) {
    return { message: axiosError.message, status: axiosError.response?.status };
  }

  return { message: 'Something went wrong. Please try again.' };
};
