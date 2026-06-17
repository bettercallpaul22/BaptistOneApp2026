import { createAsyncThunk } from '@reduxjs/toolkit';
import { toApiError } from '@/services/api/responseHandler';
import { forumService, type ForumItem, type ForumPost, type ForumComment } from '@/services/forum/forumService';

interface FetchForumsArgs {
  page?: number;
  limit?: number;
}

interface FetchForumPostsArgs {
  forumId: string;
  page?: number;
  limit?: number;
  includePending?: 'yes' | 'no';
}

export const fetchForumsThunk = createAsyncThunk<
  {
    items: ForumItem[];
    meta: { page: number; limit: number; total: number; totalPages: number };
    lastFetchedAt: string;
  },
  FetchForumsArgs | undefined,
  { rejectValue: ReturnType<typeof toApiError> }
>('forum/fetchForums', async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
  try {
    const response = await forumService.getForums(page, limit);

    if (!response.status || !response.data) {
      return rejectWithValue(toApiError(new Error(response.message || 'Unable to load forums.')));
    }

    // Handle both API shapes: direct array or { items: [], meta: {} }
    const rawData = response.data as any;
    const items = Array.isArray(rawData) ? rawData : (rawData.items || []);
    const meta = (!Array.isArray(rawData) && rawData.meta) 
      ? rawData.meta 
      : { page, limit, total: items.length, totalPages: 1 };

    return {
      items,
      meta,
      lastFetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const fetchForumPostsThunk = createAsyncThunk<
  {
    posts: ForumPost[];
    meta: { page: number; limit: number; total: number; totalPages: number };
    lastFetchedAt: string;
  },
  FetchForumPostsArgs,
  { rejectValue: ReturnType<typeof toApiError> }
>(
  'forum/fetchForumPosts',
  async ({ forumId, page = 1, limit = 20, includePending = 'no' }, { rejectWithValue }) => {
    try {
      const response = await forumService.getForumPosts(forumId, page, limit, includePending);

      if (!response.status || !response.data) {
        return rejectWithValue(toApiError(new Error(response.message || 'Unable to load posts.')));
      }

      // Handle both API shapes: direct array or { items: [], meta: {} }
      const rawData = response.data as any;
      const posts = Array.isArray(rawData) ? rawData : (rawData.items || []);
      const meta = (!Array.isArray(rawData) && rawData.meta) 
        ? rawData.meta 
        : { page, limit, total: posts.length, totalPages: 1 };

      return {
        posts,
        meta,
        lastFetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

interface FetchPostCommentsArgs {
  postId: string;
}

export const fetchPostCommentsThunk = createAsyncThunk<
  { comments: ForumComment[]; lastFetchedAt: string },
  FetchPostCommentsArgs,
  { rejectValue: ReturnType<typeof toApiError> }
>('forum/fetchPostComments', async ({ postId }, { rejectWithValue }) => {
  try {
    const response = await forumService.getPostComments(postId);

    if (!response.status || !response.data) {
      return rejectWithValue(toApiError(new Error(response.message || 'Unable to load comments.')));
    }

    const comments = Array.isArray(response.data) ? response.data : [];

    return {
      comments,
      lastFetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

interface CreateCommentArgs {
  postId: string;
  content: string;
}

export const createCommentThunk = createAsyncThunk<
  { comment: ForumComment; lastFetchedAt: string },
  CreateCommentArgs,
  { rejectValue: ReturnType<typeof toApiError> }
>('forum/createComment', async ({ postId, content }, { rejectWithValue }) => {
  try {
    const response = await forumService.createComment(postId, content);

    if (!response.status || !response.data) {
      return rejectWithValue(toApiError(new Error(response.message || 'Unable to post comment.')));
    }

    return {
      comment: response.data,
      lastFetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
