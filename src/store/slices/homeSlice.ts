import { createSlice } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import { fetchDevotionalBannerThunk, type HomeDevotionalBanner } from '@/store/thunks/homeThunk';
import type { HomeChurchContentItem } from '@/services/home/homeService';

interface HomeState {
  devotionalItems: HomeChurchContentItem[];
  latestDevotional: HomeChurchContentItem | null;
  devotionalBanner: HomeDevotionalBanner | null;
  devotionalLoading: boolean;
  devotionalError: string | null;
  devotionalLastFetchedAt: string | null;
}

const initialState: HomeState = {
  devotionalItems: [],
  latestDevotional: null,
  devotionalBanner: null,
  devotionalLoading: false,
  devotionalError: null,
  devotionalLastFetchedAt: null,
};

export const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    clearHomeDevotionalError: (state) => {
      state.devotionalError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevotionalBannerThunk.pending, (state) => {
        state.devotionalLoading = true;
        state.devotionalError = null;
      })
      .addCase(fetchDevotionalBannerThunk.fulfilled, (state, action) => {
        state.devotionalLoading = false;
        state.devotionalItems = action.payload.items;
        state.latestDevotional = action.payload.latestDevotional;
        state.devotionalBanner = action.payload.banner;
        state.devotionalLastFetchedAt = action.payload.lastFetchedAt;
        state.devotionalError = null;
      })
      .addCase(fetchDevotionalBannerThunk.rejected, (state, action) => {
        state.devotionalLoading = false;
        state.devotionalItems = [];
        state.latestDevotional = null;
        state.devotionalBanner = null;
        state.devotionalError = action.payload?.message ?? 'Unable to load devotional content.';
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearHomeDevotionalError } = homeSlice.actions;
export const homeReducer = homeSlice.reducer;
