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

export const requestToJoinMinistryThunk = createAsyncThunk<
  { ministryId: string },
  string,
  { rejectValue: ReturnType<typeof toApiError> }
>('ministry/requestToJoin', async (ministryId, { rejectWithValue }) => {
  try {
    await ministryService.requestToJoinMinistry(ministryId);
    return { ministryId };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const cancelMinistryRequestThunk = createAsyncThunk<
  { ministryId: string; requestId: string },
  { ministryId: string; requestId: string },
  { rejectValue: ReturnType<typeof toApiError> }
>('ministry/cancelRequest', async ({ ministryId, requestId }, { rejectWithValue }) => {
  try {
    await ministryService.cancelMinistryRequest(requestId);
    return { ministryId, requestId };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
