import { createSlice } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import { fetchMyMinistriesThunk, fetchChurchMinistriesThunk, requestToJoinMinistryThunk, cancelMinistryRequestThunk } from '@/store/thunks/ministryThunk';
import type { ChurchMinistry, MyMinistry } from '@/types/ministry';

interface MinistryState {
  myMinistries: MyMinistry[];
  myMinistriesLoaded: boolean;
  myMinistriesLoading: boolean;
  myMinistriesError: string | null;
  churchMinistries: ChurchMinistry[];
  churchMinistriesLoaded: boolean;
  churchMinistriesLoading: boolean;
  churchMinistriesError: string | null;
  joinRequestLoading: string | null;
  joinRequestError: string | null;
  cancelRequestLoading: string | null;
  cancelRequestError: string | null;
}

const initialState: MinistryState = {
  myMinistries: [],
  myMinistriesLoaded: false,
  myMinistriesLoading: false,
  myMinistriesError: null,
  churchMinistries: [],
  churchMinistriesLoaded: false,
  churchMinistriesLoading: false,
  churchMinistriesError: null,
  joinRequestLoading: null,
  joinRequestError: null,
  cancelRequestLoading: null,
  cancelRequestError: null,
};

export const ministrySlice = createSlice({
  name: 'ministry',
  initialState,
  reducers: {
    clearMyMinistriesError: (state) => {
      state.myMinistriesError = null;
    },
    clearChurchMinistriesError: (state) => {
      state.churchMinistriesError = null;
    },
    clearJoinRequestError: (state) => {
      state.joinRequestError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyMinistriesThunk.pending, (state) => {
        state.myMinistriesLoading = true;
        state.myMinistriesError = null;
      })
      .addCase(fetchMyMinistriesThunk.fulfilled, (state, action) => {
        state.myMinistriesLoading = false;
        state.myMinistriesLoaded = true;
        state.myMinistries = action.payload.data;
        state.myMinistriesError = null;
      })
      .addCase(fetchMyMinistriesThunk.rejected, (state, action) => {
        state.myMinistriesLoading = false;
        state.myMinistriesError = action.payload?.message ?? 'Unable to load your ministries.';
      })
      .addCase(fetchChurchMinistriesThunk.pending, (state) => {
        state.churchMinistriesLoading = true;
        state.churchMinistriesError = null;
      })
      .addCase(fetchChurchMinistriesThunk.fulfilled, (state, action) => {
        state.churchMinistriesLoading = false;
        state.churchMinistriesLoaded = true;
        state.churchMinistries = action.payload.data;
        state.churchMinistriesError = null;
      })
      .addCase(fetchChurchMinistriesThunk.rejected, (state, action) => {
        state.churchMinistriesLoading = false;
        state.churchMinistriesError = action.payload?.message ?? 'Unable to load church ministries.';
      })
      .addCase(requestToJoinMinistryThunk.pending, (state, action) => {
        state.joinRequestLoading = action.meta.arg;
        state.joinRequestError = null;
      })
      .addCase(requestToJoinMinistryThunk.fulfilled, (state, action) => {
        state.joinRequestLoading = null;
        state.joinRequestError = null;
        const ministry = state.churchMinistries.find((m) => m.ministryId === action.payload.ministryId);
        if (ministry) {
          ministry.hasPendingRequest = true;
        }
      })
      .addCase(requestToJoinMinistryThunk.rejected, (state, action) => {
        state.joinRequestLoading = null;
        state.joinRequestError = action.payload?.message ?? 'Unable to send join request.';
      })
      .addCase(cancelMinistryRequestThunk.pending, (state, action) => {
        state.cancelRequestLoading = action.meta.arg.ministryId;
        state.cancelRequestError = null;
      })
      .addCase(cancelMinistryRequestThunk.fulfilled, (state, action) => {
        state.cancelRequestLoading = null;
        state.cancelRequestError = null;
        const ministry = state.churchMinistries.find((m) => m.ministryId === action.payload.ministryId);
        if (ministry) {
          ministry.hasPendingRequest = false;
          ministry.pendingRequest = null;
        }
      })
      .addCase(cancelMinistryRequestThunk.rejected, (state, action) => {
        state.cancelRequestLoading = null;
        state.cancelRequestError = action.payload?.message ?? 'Unable to cancel request.';
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearMyMinistriesError, clearChurchMinistriesError, clearJoinRequestError } = ministrySlice.actions;
export const ministryReducer = ministrySlice.reducer;
