import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import {
  fetchChurchRegistrationOptionsThunk,
  onboardMemberToChurchThunk,
  revokeMembershipRequestThunk,
} from '@/store/thunks/churchThunk';
import type { ChurchRegistrationOption, ChurchRegistrationOptionsMeta } from '@/types/church';

interface ChurchState {
  items: ChurchRegistrationOption[];
  meta: ChurchRegistrationOptionsMeta | null;
  query: string;
  selectedChurchId: string | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  loadMoreError: string | null;
  onboardingLoading: boolean;
  onboardingError: string | null;
  onboardingSuccessMessage: string | null;
  revokeLoading: boolean;
  revokeError: string | null;
  revokeSuccessMessage: string | null;
  lastFetchedAt: string | null;
}

const initialState: ChurchState = {
  items: [],
  meta: null,
  query: '',
  selectedChurchId: null,
  loading: false,
  loadingMore: false,
  error: null,
  loadMoreError: null,
  onboardingLoading: false,
  onboardingError: null,
  onboardingSuccessMessage: null,
  revokeLoading: false,
  revokeError: null,
  revokeSuccessMessage: null,
  lastFetchedAt: null,
};

export const churchSlice = createSlice({
  name: 'church',
  initialState,
  reducers: {
    setChurchQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setSelectedChurchId: (state, action: PayloadAction<string | null>) => {
      state.selectedChurchId = action.payload;
      state.onboardingError = null;
      state.onboardingSuccessMessage = null;
    },
    clearChurchError: (state) => {
      state.error = null;
      state.loadMoreError = null;
    },
    clearChurchOnboardingStatus: (state) => {
      state.onboardingError = null;
      state.onboardingSuccessMessage = null;
    },
    clearChurchRevokeStatus: (state) => {
      state.revokeError = null;
      state.revokeSuccessMessage = null;
    },
    clearChurchState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChurchRegistrationOptionsThunk.pending, (state, action) => {
        const page = action.meta.arg?.page ?? 1;

        if (page > 1) {
          state.loadingMore = true;
          state.loadMoreError = null;
          return;
        }

        state.loading = true;
        state.error = null;
        state.loadMoreError = null;
      })
      .addCase(fetchChurchRegistrationOptionsThunk.fulfilled, (state, action) => {
        const shouldAppend = action.payload.meta.page > 1;

        state.loading = false;
        state.loadingMore = false;

        if (action.payload.query !== state.query) {
          return;
        }

        state.items = shouldAppend
          ? [
              ...state.items,
              ...action.payload.items.filter(
                (nextChurch) => !state.items.some((currentChurch) => currentChurch.id === nextChurch.id),
              ),
            ]
          : action.payload.items;
        state.meta = action.payload.meta;
        state.query = action.payload.query;
        state.lastFetchedAt = action.payload.lastFetchedAt;
        state.error = null;
        state.loadMoreError = null;
      })
      .addCase(fetchChurchRegistrationOptionsThunk.rejected, (state, action) => {
        const page = action.meta.arg?.page ?? 1;

        if (page > 1) {
          state.loadingMore = false;
          state.loadMoreError = action.payload?.message ?? 'Unable to load more churches.';
          return;
        }

        state.loading = false;
        state.error = action.payload?.message ?? 'Unable to load churches.';
      })
      .addCase(onboardMemberToChurchThunk.pending, (state) => {
        state.onboardingLoading = true;
        state.onboardingError = null;
        state.onboardingSuccessMessage = null;
      })
      .addCase(onboardMemberToChurchThunk.fulfilled, (state, action) => {
        state.onboardingLoading = false;
        state.onboardingError = null;
        state.onboardingSuccessMessage = action.payload.message || 'Join request sent successfully.';
      })
      .addCase(onboardMemberToChurchThunk.rejected, (state, action) => {
        state.onboardingLoading = false;
        state.onboardingError = action.payload?.message ?? 'Unable to send join request.';
      })
      .addCase(revokeMembershipRequestThunk.pending, (state) => {
        state.revokeLoading = true;
        state.revokeError = null;
        state.revokeSuccessMessage = null;
      })
      .addCase(revokeMembershipRequestThunk.fulfilled, (state, action) => {
        state.revokeLoading = false;
        state.revokeError = null;
        state.revokeSuccessMessage = action.payload.message || 'Church request revoked successfully.';
      })
      .addCase(revokeMembershipRequestThunk.rejected, (state, action) => {
        state.revokeLoading = false;
        state.revokeError = action.payload?.message ?? 'Unable to revoke church request.';
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  clearChurchError,
  clearChurchOnboardingStatus,
  clearChurchRevokeStatus,
  clearChurchState,
  setChurchQuery,
  setSelectedChurchId,
} = churchSlice.actions;
export const churchReducer = churchSlice.reducer;
