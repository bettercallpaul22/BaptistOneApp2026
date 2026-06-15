import { createAsyncThunk } from '@reduxjs/toolkit';
import { toApiError } from '@/services/api/responseHandler';
import { givingService } from '@/services/giving/givingService';
import type { RootState } from '@/store/rootReducer';
import type { CreateGivingPayload, CreateGivingResponse, GivingConfigResponse } from '@/types/giving';

export const fetchGivingConfigThunk = createAsyncThunk<
  GivingConfigResponse & { churchId: string; lastFetchedAt: string },
  string,
  { rejectValue: ReturnType<typeof toApiError>; state: RootState }
>(
  'giving/fetchConfig',
  async (churchId, { rejectWithValue }) => {
    try {
      const response = await givingService.getConfig(churchId);

      return {
        ...response,
        churchId,
        lastFetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
  {
    condition: (churchId, { getState }) => {
      const { configChurchId, configLoading } = getState().giving;
      return !configLoading || configChurchId !== churchId;
    },
  },
);

export const createGivingThunk = createAsyncThunk<
  CreateGivingResponse,
  CreateGivingPayload,
  { rejectValue: ReturnType<typeof toApiError>; state: RootState }
>(
  'giving/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await givingService.createGiving(payload);
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
  {
    condition: (_, { getState }) => {
      const { paymentLoading } = getState().giving;
      return !paymentLoading;
    },
  },
);
