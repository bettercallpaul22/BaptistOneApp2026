import { createAsyncThunk } from '@reduxjs/toolkit';
import { storageKeys } from '@/constants/storage';
import { toApiError } from '@/services/api/responseHandler';
import { memberService } from '@/services/member/memberService';
import type { MemberAccount, MemberBasicProfileUpdateRequest, StoredMemberAccount } from '@/types/member';

export const fetchMemberAccountThunk = createAsyncThunk<
  StoredMemberAccount,
  void,
  { rejectValue: ReturnType<typeof toApiError> }
>('member/fetchMemberAccount', async (_, { rejectWithValue }) => {
  try {
    const response = await memberService.getMemberAccount();
    const result = {
      data: response.data as MemberAccount,
      lastFetchedAt: new Date().toISOString(),
    };

    localStorage.setItem(storageKeys.memberAccount, JSON.stringify(result));

    return result;
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const updateBasicProfileThunk = createAsyncThunk<
  MemberAccount,
  MemberBasicProfileUpdateRequest,
  { rejectValue: ReturnType<typeof toApiError> }
>('member/updateBasicProfile', async (payload, { rejectWithValue }) => {
  try {
    const response = await memberService.updateBasicProfile(payload);

    if (!response.status || !response.data) {
      return rejectWithValue(toApiError(new Error(response.message || 'Unable to update basic profile.')));
    }

    return response.data;
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
