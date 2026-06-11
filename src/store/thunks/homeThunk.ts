import { createAsyncThunk } from '@reduxjs/toolkit';
import { toApiError } from '@/services/api/responseHandler';
import { homeService } from '@/services/home/homeService';

export const fetchUpdatesThunk = createAsyncThunk('home/fetchUpdates', async (_, { rejectWithValue }) => {
  try {
    return await homeService.getUpdates();
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
