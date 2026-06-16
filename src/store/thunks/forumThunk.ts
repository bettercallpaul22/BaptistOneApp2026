import { createAsyncThunk } from '@reduxjs/toolkit';
import { toApiError } from '@/services/api/responseHandler';
import { forumService, type ForumItem } from '@/services/forum/forumService';

interface FetchForumsArgs {
  page?: number;
  limit?: number;
}

export const fetchForumsThunk = createAsyncThunk<
  { items: ForumItem[]; meta: { page: number; limit: number; total: number; totalPages: number }; lastFetchedAt: string },
  FetchForumsArgs | undefined,
  { rejectValue: ReturnType<typeof toApiError> }
>('forum/fetchForums', async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
  try {
    const response = await forumService.getForums(page, limit);

    if (!response.status || !response.data) {
      return rejectWithValue(toApiError(new Error(response.message || 'Unable to load forums.')));
    }

    return {
      items: response.data.items,
      meta: response.data.meta,
      lastFetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
