import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import { fetchForumsThunk } from '@/store/thunks/forumThunk';
import type { ApiResponse } from '@/types/api';
import type { ForumItem } from '@/services/forum/forumService';
import type { ForumDepartment, ForumUnit } from '@/pages/forum/forumData';

interface UserDepartmentResponse {
  membershipId: string;
  role: string;
  joinedAt: string;
  departmentId: string;
  name: string;
  slug: string;
  description: string | null;
  churchId: string;
}

interface UserUnitResponse {
  membershipId: string;
  role: string;
  joinedAt: string;
  unitId: string;
  unitName: string;
  unitSlug: string;
  unitDescription: string | null;
  departmentId: string;
  departmentName: string;
  churchId: string;
}

export const fetchUserDepartmentsThunk = createAsyncThunk<
  { items: ForumDepartment[]; lastFetchedAt: string },
  void,
  { rejectValue: string }
>('forum/fetchUserDepartments', async (_, { rejectWithValue }) => {
  try {
    const response = await http.get<ApiResponse<UserDepartmentResponse[]>>(endpoints.privateMembers.myDepartments);

    if (!response.status || !response.data) {
      return rejectWithValue('Unable to load departments.');
    }

    return {
      items: response.data.map((department) => ({
        id: department.departmentId,
        title: department.name,
        description: department.description ?? '',
        members: [],
        forumIds: [],
      })),
      lastFetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unable to load departments.');
  }
});

export const fetchUserUnitsThunk = createAsyncThunk<
  { items: ForumUnit[]; lastFetchedAt: string },
  void,
  { rejectValue: string }
>('forum/fetchUserUnits', async (_, { rejectWithValue }) => {
  try {
    const response = await http.get<ApiResponse<UserUnitResponse[]>>(endpoints.privateMembers.myUnits);

    if (!response.status || !response.data) {
      return rejectWithValue('Unable to load units.');
    }

    return {
      items: response.data.map((unit) => ({
        id: unit.unitId,
        title: unit.unitName,
        description: unit.unitDescription ?? '',
        departmentId: unit.departmentId,
        members: [],
        forumIds: [],
      })),
      lastFetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unable to load units.');
  }
});

interface ForumState {
  items: ForumItem[];
  meta: { page: number; limit: number; total: number; totalPages: number } | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  loadMoreError: string | null;
  lastFetchedAt: string | null;
  departments: ForumDepartment[];
  units: ForumUnit[];
  departmentsLoading: boolean;
  departmentsError: string | null;
  unitsLoading: boolean;
  unitsError: string | null;
}

const initialState: ForumState = {
  items: [],
  meta: null,
  loading: false,
  loadingMore: false,
  error: null,
  loadMoreError: null,
  lastFetchedAt: null,
  departments: [],
  units: [],
  departmentsLoading: false,
  departmentsError: null,
  unitsLoading: false,
  unitsError: null,
};

export const forumSlice = createSlice({
  name: 'forum',
  initialState,
  reducers: {
    clearForumError: (state) => {
      state.error = null;
      state.loadMoreError = null;
    },
    clearForumState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchForumsThunk.pending, (state, action) => {
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
      .addCase(fetchForumsThunk.fulfilled, (state, action) => {
        const shouldAppend = action.payload.meta.page > 1;

        state.loading = false;
        state.loadingMore = false;

        state.items = shouldAppend
          ? [...state.items, ...action.payload.items.filter((nextForum) => !state.items.some((current) => current.id === nextForum.id))]
          : action.payload.items;
        state.meta = action.payload.meta;
        state.lastFetchedAt = action.payload.lastFetchedAt;
        state.error = null;
        state.loadMoreError = null;
      })
      .addCase(fetchForumsThunk.rejected, (state, action) => {
        const page = action.meta.arg?.page ?? 1;

        if (page > 1) {
          state.loadingMore = false;
          state.loadMoreError = action.payload?.message ?? 'Unable to load more forums.';
          return;
        }

        state.loading = false;
        state.error = action.payload?.message ?? 'Unable to load forums.';
      })
      .addCase(fetchUserDepartmentsThunk.pending, (state) => {
        state.departmentsLoading = true;
        state.departmentsError = null;
      })
      .addCase(fetchUserDepartmentsThunk.fulfilled, (state, action) => {
        state.departmentsLoading = false;
        state.departments = action.payload.items;
      })
      .addCase(fetchUserDepartmentsThunk.rejected, (state, action) => {
        state.departmentsLoading = false;
        state.departmentsError = action.payload ?? 'Unable to load departments.';
      })
      .addCase(fetchUserUnitsThunk.pending, (state) => {
        state.unitsLoading = true;
        state.unitsError = null;
      })
      .addCase(fetchUserUnitsThunk.fulfilled, (state, action) => {
        state.unitsLoading = false;
        state.units = action.payload.items;
      })
      .addCase(fetchUserUnitsThunk.rejected, (state, action) => {
        state.unitsLoading = false;
        state.unitsError = action.payload ?? 'Unable to load units.';
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearForumError, clearForumState } = forumSlice.actions;
export const forumReducer = forumSlice.reducer;
