import { createAsyncThunk } from '@reduxjs/toolkit';
import { storageKeys } from '@/constants/storage';
import { toApiError } from '@/services/api/responseHandler';
import { memberService } from '@/services/member/memberService';
import type { MemberAccount, StoredMemberAccount } from '@/types/member';

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
