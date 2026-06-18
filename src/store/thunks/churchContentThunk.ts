import { createAsyncThunk } from '@reduxjs/toolkit';
import { toApiError } from '@/services/api/responseHandler';
import { churchContentService, type ChurchContentItem, type ChurchContentMeta } from '@/services/churchContent/churchContentService';
import type { ChurchContentType } from '@/types/churchContent';

export interface FetchChurchContentResult {
  items: ChurchContentItem[];
  meta: ChurchContentMeta;
  type: ChurchContentType;
  lastFetchedAt: string;
}

export const fetchChurchContentThunk = createAsyncThunk<
  FetchChurchContentResult,
  { type: ChurchContentType; page?: number; limit?: number },
  { rejectValue: ReturnType<typeof toApiError> }
>('churchContent/fetch', async (payload, { rejectWithValue }) => {
  try {
    const result = await churchContentService.getContent(payload);

    return {
      items: result.items,
      meta: result.meta,
      type: payload.type,
      lastFetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
