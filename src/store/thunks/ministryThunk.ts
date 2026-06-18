import { createAsyncThunk } from '@reduxjs/toolkit';
import { toApiError } from '@/services/api/responseHandler';
import { ministryService } from '@/services/ministry/ministryService';
import type { ChurchMinistriesResponse, MyMinistryResponse } from '@/types/ministry';

export const fetchMyMinistriesThunk = createAsyncThunk<
  MyMinistryResponse,
  void,
  { rejectValue: ReturnType<typeof toApiError> }
>('ministry/fetchMyMinistries', async (_, { rejectWithValue }) => {
  try {
    return await ministryService.getMyMinistries();
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const fetchChurchMinistriesThunk = createAsyncThunk<
  ChurchMinistriesResponse,
  void,
  { rejectValue: ReturnType<typeof toApiError> }
>('ministry/fetchChurchMinistries', async (_, { rejectWithValue }) => {
  try {
    return await ministryService.getChurchMinistries();
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
