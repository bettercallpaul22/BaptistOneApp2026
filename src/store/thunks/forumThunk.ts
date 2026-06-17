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

interface DeleteCommentArgs {
  commentId: string;
}

export const deleteCommentThunk = createAsyncThunk<
  { commentId: string },
  DeleteCommentArgs,
  { rejectValue: ReturnType<typeof toApiError> }
>('forum/deleteComment', async ({ commentId }, { rejectWithValue }) => {
  try {
    const response = await forumService.deleteComment(commentId);

    if (!response.status) {
      return rejectWithValue(toApiError(new Error(response.message || 'Unable to delete comment.')));
    }

    return { commentId };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

interface DeletePostArgs {
  postId: string;
}

export const deletePostThunk = createAsyncThunk<
  { postId: string },
  DeletePostArgs,
  { rejectValue: ReturnType<typeof toApiError> }
>('forum/deletePost', async ({ postId }, { rejectWithValue }) => {
  try {
    const response = await forumService.deletePost(postId);

    if (!response.status) {
      return rejectWithValue(toApiError(new Error(response.message || 'Unable to delete post.')));
    }

    return { postId };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

interface CreatePostArgs {
  forumId: string;
  title: string;
  content: string;
  postType: string;
}

export const createPostThunk = createAsyncThunk<
  { post: ForumPost; lastFetchedAt: string },
  CreatePostArgs,
  { rejectValue: ReturnType<typeof toApiError> }
>('forum/createPost', async ({ forumId, title, content, postType }, { rejectWithValue }) => {
  try {
    const response = await forumService.createPost(forumId, {
      title,
      content,
      postType,
      mediaFileIds: [],
    });

    if (!response.status || !response.data) {
      return rejectWithValue(toApiError(new Error(response.message || 'Unable to create post.')));
    }

    return {
      post: response.data,
      lastFetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
