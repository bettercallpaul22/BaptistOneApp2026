import { createAsyncThunk } from '@reduxjs/toolkit';
import { toApiError } from '@/services/api/responseHandler';
import { userService } from '@/services/user/userService';

export const fetchProfileThunk = createAsyncThunk('user/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    return await userService.getProfile();
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
