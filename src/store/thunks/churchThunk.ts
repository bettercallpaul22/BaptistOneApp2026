import { createAsyncThunk } from '@reduxjs/toolkit';
import { toApiError } from '@/services/api/responseHandler';
import { churchService } from '@/services/church/churchService';
import type {
  ChurchRegistrationOptionsData,
  FetchChurchRegistrationOptionsPayload,
  OnboardMemberPayload,
  OnboardMemberResponse,
  RevokeMembershipRequestPayload,
  RevokeMembershipRequestResponse,
} from '@/types/church';

export const fetchChurchRegistrationOptionsThunk = createAsyncThunk<
  ChurchRegistrationOptionsData & { query: string; lastFetchedAt: string },
  FetchChurchRegistrationOptionsPayload | undefined,
  { rejectValue: ReturnType<typeof toApiError> }
>('church/fetchRegistrationOptions', async (payload, { rejectWithValue }) => {
  try {
    const query = payload?.search?.trim() ?? '';
    const response = await churchService.getRegistrationOptions({ ...payload, search: query });

    return {
      ...response.data,
      query,
      lastFetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const onboardMemberToChurchThunk = createAsyncThunk<
  OnboardMemberResponse,
  OnboardMemberPayload,
  { rejectValue: ReturnType<typeof toApiError> }
>('church/onboardMember', async (payload, { rejectWithValue }) => {
  try {
    return await churchService.onboardMember(payload);
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const revokeMembershipRequestThunk = createAsyncThunk<
  RevokeMembershipRequestResponse,
  RevokeMembershipRequestPayload,
  { rejectValue: ReturnType<typeof toApiError> }
>('church/revokeMembershipRequest', async (payload, { rejectWithValue }) => {
  try {
    return await churchService.revokeMembershipRequest(payload);
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
