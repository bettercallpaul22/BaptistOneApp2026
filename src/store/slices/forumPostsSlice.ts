import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import { fetchForumPostsThunk } from '@/store/thunks/forumThunk';
import type { ForumPost } from '@/services/forum/forumService';

interface ForumPostsState {
  posts: ForumPost[];
  meta: { page: number; limit: number; total: number; totalPages: number } | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  loadMoreError: string | null;
  lastFetchedAt: string | null;
  currentForumId: string | null;
}

const initialState: ForumPostsState = {
  posts: [],
  meta: null,
  loading: false,
  loadingMore: false,
  error: null,
  loadMoreError: null,
  lastFetchedAt: null,
  currentForumId: null,
};

export const forumPostsSlice = createSlice({
  name: 'forumPosts',
  initialState,
  reducers: {
    clearForumPostsError: (state) => {
      state.error = null;
      state.loadMoreError = null;
    },
    clearForumPostsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchForumPostsThunk.pending, (state, action) => {
        const page = action.meta.arg?.page ?? 1;
        const forumId = action.meta.arg.forumId;

        if (page > 1) {
          state.loadingMore = true;
          state.loadMoreError = null;
          return;
        }

        state.loading = true;
        state.error = null;
        state.loadMoreError = null;
        state.currentForumId = forumId;
        state.posts = [];
      })
      .addCase(fetchForumPostsThunk.fulfilled, (state, action) => {
        const { posts = [], meta } = action.payload;
        const shouldAppend = (meta?.page ?? 1) > 1;

        state.loading = false;
        state.loadingMore = false;

        state.posts = shouldAppend
          ? [...state.posts, ...posts.filter((nextPost) => !state.posts.some((current) => current.id === nextPost.id))]
          : posts;
        state.meta = meta;
        state.lastFetchedAt = action.payload.lastFetchedAt;
        state.error = null;
        state.loadMoreError = null;
      })
      .addCase(fetchForumPostsThunk.rejected, (state, action) => {
        const page = action.meta.arg?.page ?? 1;

        if (page > 1) {
          state.loadingMore = false;
          state.loadMoreError = action.payload?.message ?? 'Unable to load more posts.';
          return;
        }

        state.loading = false;
        state.error = action.payload?.message ?? 'Unable to load posts.';
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearForumPostsError, clearForumPostsState } = forumPostsSlice.actions;
