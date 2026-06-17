import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type { ApiResponse } from '@/types/api';
import { type ForumItem, type ForumPost, type ForumComment } from '@/services/forum/forumService';
import type { ForumDepartment, ForumUnit } from '@/pages/forum/forumData';
import { fetchForumsThunk, fetchForumPostsThunk, fetchPostCommentsThunk, createCommentThunk, deleteCommentThunk, deletePostThunk, createPostThunk } from '@/store/thunks/forumThunk';

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

export { fetchForumsThunk, fetchForumPostsThunk };

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
  posts: ForumPost[];
  postsMeta: { page: number; limit: number; total: number; totalPages: number } | null;
  postsLoading: boolean;
  postsLoadingMore: boolean;
  postsError: string | null;
  postsLoadMoreError: string | null;
  currentForumId: string | null;
  comments: ForumComment[];
  commentsLoading: boolean;
  commentsError: string | null;
  creatingComment: boolean;
  createCommentError: string | null;
  deletingCommentId: string | null;
  deleteCommentError: string | null;
  deletingPostId: string | null;
  deletePostError: string | null;
  creatingPost: boolean;
  createPostError: string | null;
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
  posts: [],
  postsMeta: null,
  postsLoading: false,
  postsLoadingMore: false,
  postsError: null,
  postsLoadMoreError: null,
  currentForumId: null,
  comments: [],
  commentsLoading: false,
  commentsError: null,
  creatingComment: false,
  createCommentError: null,
  deletingCommentId: null,
  deleteCommentError: null,
  deletingPostId: null,
  deletePostError: null,
  creatingPost: false,
  createPostError: null,
};

export const forumSlice = createSlice({
  name: 'forum',
  initialState,
  reducers: {
    clearForumError: (state) => {
      state.error = null;
      state.loadMoreError = null;
    },
    clearForumPostsError: (state) => {
      state.postsError = null;
      state.postsLoadMoreError = null;
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
      .addCase(fetchForumPostsThunk.pending, (state, action) => {
        console.log('fetchForumPostsThunk.pending', action);
        const page = action.meta.arg?.page ?? 1;
        const forumId = action.meta.arg.forumId;

        if (page > 1) {
          state.postsLoadingMore = true;
          state.postsLoadMoreError = null;
          return;
        }

        state.postsLoading = true;
        state.postsError = null;
        state.postsLoadMoreError = null;
        state.currentForumId = forumId;
        state.posts = [];
      })
      .addCase(fetchForumPostsThunk.fulfilled, (state, action) => {
        const { posts = [], meta } = action.payload;
        // Safely check page number to prevent TypeError
        const shouldAppend = (meta?.page ?? 1) > 1;

        state.postsLoading = false;
        state.postsLoadingMore = false;

        state.posts = shouldAppend
          ? [...state.posts, ...posts.filter((nextPost) => !state.posts.some((current) => current.id === nextPost.id))]
          : posts;
        state.postsMeta = meta;
        state.postsError = null;
        state.postsLoadMoreError = null;
      })
      .addCase(fetchForumPostsThunk.rejected, (state, action) => {
        console.log('fetchForumPostsThunk.rejected', action);

        const page = action.meta.arg?.page ?? 1;

        if (page > 1) {
          state.postsLoadingMore = false;
          state.postsLoadMoreError = action.payload?.message ?? 'Unable to load more posts.';
          return;
        }

        state.postsLoading = false;
        state.postsError = action.payload?.message ?? 'Unable to load posts.';
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
      .addCase(fetchPostCommentsThunk.pending, (state) => {
        state.commentsLoading = true;
        state.commentsError = null;
      })
      .addCase(fetchPostCommentsThunk.fulfilled, (state, action) => {
        state.commentsLoading = false;
        state.comments = action.payload.comments;
        state.commentsError = null;
      })
      .addCase(fetchPostCommentsThunk.rejected, (state, action) => {
        state.commentsLoading = false;
        state.commentsError = action.payload?.message ?? 'Unable to load comments.';
      })
      .addCase(createCommentThunk.pending, (state) => {
        state.creatingComment = true;
        state.createCommentError = null;
      })
      .addCase(createCommentThunk.fulfilled, (state, action) => {
        state.creatingComment = false;
        state.comments.push(action.payload.comment);
        state.createCommentError = null;
      })
      .addCase(createCommentThunk.rejected, (state, action) => {
        state.creatingComment = false;
        state.createCommentError = action.payload?.message ?? 'Unable to post comment.';
      })
      .addCase(deleteCommentThunk.pending, (state, action) => {
        state.deletingCommentId = action.meta.arg.commentId;
        state.deleteCommentError = null;
      })
      .addCase(deleteCommentThunk.fulfilled, (state, action) => {
        state.deletingCommentId = null;
        state.comments = state.comments.filter((c) => c.id !== action.payload.commentId);
        state.deleteCommentError = null;
      })
      .addCase(deleteCommentThunk.rejected, (state, action) => {
        state.deletingCommentId = null;
        state.deleteCommentError = action.payload?.message ?? 'Unable to delete comment.';
      })
      .addCase(deletePostThunk.pending, (state, action) => {
        state.deletingPostId = action.meta.arg.postId;
        state.deletePostError = null;
      })
      .addCase(deletePostThunk.fulfilled, (state, action) => {
        state.deletingPostId = null;
        state.posts = state.posts.filter((p) => p.id !== action.payload.postId);
        state.deletePostError = null;
      })
      .addCase(deletePostThunk.rejected, (state, action) => {
        state.deletingPostId = null;
        state.deletePostError = action.payload?.message ?? 'Unable to delete post.';
      })
      .addCase(createPostThunk.pending, (state) => {
        state.creatingPost = true;
        state.createPostError = null;
      })
      .addCase(createPostThunk.fulfilled, (state, action) => {
        state.creatingPost = false;
        state.posts.unshift(action.payload.post);
        state.createPostError = null;
      })
      .addCase(createPostThunk.rejected, (state, action) => {
        state.creatingPost = false;
        state.createPostError = action.payload?.message ?? 'Unable to create post.';
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearForumError, clearForumPostsError, clearForumState } = forumSlice.actions;
export const forumReducer = forumSlice.reducer;
