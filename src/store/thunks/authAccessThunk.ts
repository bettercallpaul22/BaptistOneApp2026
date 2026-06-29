import { createAsyncThunk } from '@reduxjs/toolkit';
import { toApiError } from '@/services/api/responseHandler';
import { authService } from '@/services/auth/authService';
import type { AuthAccessData } from '@/types/auth';

export const fetchAuthAccessThunk = createAsyncThunk<
  AuthAccessData,
  void,
  { rejectValue: ReturnType<typeof toApiError> }
>('authAccess/fetch', async (_, { rejectWithValue }) => {
  try {
    const response = await authService.getAuthAccess();

    if (!response.status || !response.data) {
      return rejectWithValue({ message: response.message || 'Unable to fetch user access.' });
    }

    return response.data;
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
