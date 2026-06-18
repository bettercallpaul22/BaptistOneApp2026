import { createSlice } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import { fetchChurchContentThunk } from '@/store/thunks/churchContentThunk';
import type { ChurchContentItem, ChurchContentMeta, ChurchContentType } from '@/types/churchContent';

interface ChurchContentState {
  items: ChurchContentItem[];
  meta: ChurchContentMeta | null;
  type: ChurchContentType | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  loadMoreError: string | null;
  lastFetchedAt: string | null;
}

const initialState: ChurchContentState = {
  items: [],
  meta: null,
  type: null,
  loading: false,
  loadingMore: false,
  error: null,
  loadMoreError: null,
  lastFetchedAt: null,
};

export const churchContentSlice = createSlice({
  name: 'churchContent',
  initialState,
  reducers: {
    clearChurchContentError: (state) => {
      state.error = null;
      state.loadMoreError = null;
    },
    resetChurchContent: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChurchContentThunk.pending, (state, action) => {
        const page = action.meta.arg.page ?? 1;

        if (page > 1) {
          state.loadingMore = true;
          state.loadMoreError = null;
          return;
        }

        state.loading = true;
        state.error = null;
        state.loadMoreError = null;
      })
      .addCase(fetchChurchContentThunk.fulfilled, (state, action) => {
        const shouldAppend = (action.payload.meta.page ?? 1) > 1;

        state.loading = false;
        state.loadingMore = false;

        if (action.payload.type !== state.type) {
          state.items = action.payload.items;
          state.meta = action.payload.meta;
          state.type = action.payload.type;
          state.lastFetchedAt = action.payload.lastFetchedAt;
          state.error = null;
          state.loadMoreError = null;
          return;
        }

        state.items = shouldAppend
          ? [
              ...state.items,
              ...action.payload.items.filter(
                (next) => !state.items.some((current) => current.id === next.id),
              ),
            ]
          : action.payload.items;
        state.meta = action.payload.meta;
        state.type = action.payload.type;
        state.lastFetchedAt = action.payload.lastFetchedAt;
        state.error = null;
        state.loadMoreError = null;
      })
      .addCase(fetchChurchContentThunk.rejected, (state, action) => {
        const page = action.meta.arg.page ?? 1;

        if (page > 1) {
          state.loadingMore = false;
          state.loadMoreError = action.payload?.message ?? 'Unable to load more content.';
          return;
        }

        state.loading = false;
        state.error = action.payload?.message ?? 'Unable to load content.';
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearChurchContentError, resetChurchContent } = churchContentSlice.actions;
export const churchContentReducer = churchContentSlice.reducer;
