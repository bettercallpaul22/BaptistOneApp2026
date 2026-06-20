import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import { switchAccessThunk } from '@/store/thunks/authThunk';
import {
  fetchProfileCompletionThunk,
  updateProfileCompletionSectionThunk,
} from '@/store/thunks/profileThunk';
import type { ProfileCompletion } from '@/types/profile';

interface UserAvatarUrlState {
  value: string | null;
}

const initialState: UserAvatarUrlState = {
  value: null,
};

const getProfileAvatarUrl = (profile: ProfileCompletion) => {
  const avatarFile = profile.personalInformation?.avatarFile;

  return avatarFile && typeof avatarFile === 'object' && !Array.isArray(avatarFile)
    ? typeof avatarFile.url === 'string'
      ? avatarFile.url
      : null
    : null;
};

const resetUserAvatarUrl = (state: UserAvatarUrlState) => {
  state.value = null;
};

export const userAvatarUrlSlice = createSlice({
  name: 'userAvatarUrl',
  initialState,
  reducers: {
    setUserAvatarUrl: (state, action: PayloadAction<string | null>) => {
      state.value = action.payload;
    },
    clearUserAvatarUrl: resetUserAvatarUrl,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileCompletionThunk.fulfilled, (state, action) => {
        state.value = getProfileAvatarUrl(action.payload.data);
      })
      .addCase(updateProfileCompletionSectionThunk.fulfilled, (state, action) => {
        state.value = getProfileAvatarUrl(action.payload.data);
      })
      .addCase(switchAccessThunk.fulfilled, resetUserAvatarUrl)
      .addCase(logout, resetUserAvatarUrl);
  },
});

export const { clearUserAvatarUrl, setUserAvatarUrl } = userAvatarUrlSlice.actions;
export const userAvatarUrlReducer = userAvatarUrlSlice.reducer;
