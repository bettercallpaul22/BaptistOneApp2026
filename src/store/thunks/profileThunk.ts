import { createAsyncThunk } from '@reduxjs/toolkit';
import { storageKeys } from '@/constants/storage';
import { toApiError } from '@/services/api/responseHandler';
import { profileService } from '@/services/profile/profileService';
import type { ProfileCompletion, StoredProfileCompletion, UpdateProfileCompletionSectionPayload } from '@/types/profile';

export const fetchProfileCompletionThunk = createAsyncThunk<
  StoredProfileCompletion,
  void,
  { rejectValue: ReturnType<typeof toApiError> }
>('profile/fetchProfileCompletion', async (_, { rejectWithValue }) => {
  try {
    const response = await profileService.getProfileCompletion();
    const result = {
      data: response.data as ProfileCompletion,
      lastFetchedAt: new Date().toISOString(),
    };

    localStorage.setItem(storageKeys.profileCompletion, JSON.stringify(result));

    return result;
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const updateProfileCompletionSectionThunk = createAsyncThunk<
  StoredProfileCompletion,
  UpdateProfileCompletionSectionPayload,
  { rejectValue: ReturnType<typeof toApiError> }
>('profile/updateProfileCompletionSection', async (payload, { rejectWithValue }) => {
  try {
    await profileService.updateProfileCompletionSection(payload);
    const response = await profileService.getProfileCompletion();
    const result = {
      data: response.data as ProfileCompletion,
      lastFetchedAt: new Date().toISOString(),
    };

    localStorage.setItem(storageKeys.profileCompletion, JSON.stringify(result));

    return result;
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
