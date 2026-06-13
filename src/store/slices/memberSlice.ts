import { createSlice } from '@reduxjs/toolkit';
import { storageKeys } from '@/constants/storage';
import { logout } from '@/store/slices/authSlice';
import { fetchMemberAccountThunk } from '@/store/thunks/memberThunk';
import type { MemberAccount, StoredMemberAccount } from '@/types/member';

interface MemberState {
  data: MemberAccount | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: string | null;
}

const readStoredMemberAccount = (): StoredMemberAccount | null => {
  const value = localStorage.getItem(storageKeys.memberAccount);

  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as StoredMemberAccount;
    return parsed.data ? parsed : null;
  } catch {
    return null;
  }
};

const storedMemberAccount = readStoredMemberAccount();

const initialState: MemberState = {
  data: storedMemberAccount?.data ?? null,
  loading: false,
  error: null,
  lastFetchedAt: storedMemberAccount?.lastFetchedAt ?? null,
};

const clearStoredMemberAccount = () => {
  localStorage.removeItem(storageKeys.memberAccount);
};

export const memberSlice = createSlice({
  name: 'member',
  initialState,
  reducers: {
    clearMemberError: (state) => {
      state.error = null;
    },
    clearMemberAccount: (state) => {
      state.data = null;
      state.error = null;
      state.lastFetchedAt = null;
      clearStoredMemberAccount();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMemberAccountThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMemberAccountThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.lastFetchedAt = action.payload.lastFetchedAt;
        state.error = null;
      })
      .addCase(fetchMemberAccountThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message ?? 'Unable to load member account.';
      })
      .addCase(logout, (state) => {
        state.data = null;
        state.error = null;
        state.lastFetchedAt = null;
        state.loading = false;
        clearStoredMemberAccount();
      });
  },
});

export const { clearMemberAccount, clearMemberError } = memberSlice.actions;
export const memberReducer = memberSlice.reducer;
