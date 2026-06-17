import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type { ApiResponse } from '@/types/api';

export interface ForumMember {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface ForumPostAuthor {
  id: string;
  type: string;
  displayName: string;
  avatarUrl: string | null;
  firstName: string;
  lastName: string;
}

export interface ForumPostMediaFile {
  id: string;
  url: string;
  type: string;
}

export interface ForumComment {
  id: string;
  postId: string;
  authorType: string;
  authorId: string;
  content: string;
  parentCommentId: string;
  createdAt: string;
  author: ForumPostAuthor;
}

export interface ForumPost {
  id: string;
  forumId: string;
  authorType: string;
  authorId: string;
  title: string;
  content: string;
  postType: string;
  moderationStatus: string;
  moderationReason: string | null;
  moderatedAt: string | null;
  moderatedByProfileId: string | null;
  mediaFileIds: string[];
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  author: ForumPostAuthor;
  mediaFiles: ForumPostMediaFile[];
}

export interface ForumPostsResponseData {
  items: ForumPost[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ForumItem {
  id: string;
  churchId: string;
  forumType: string;
  departmentId: string | null;
  unitId: string | null;
  ministryId: string | null;
  title: string;
  description: string;
  createdByProfileId: string;
  isActive: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  postCount?: number;
  members?: ForumMember[];
  posts?: ForumPost[];
}

interface ForumsResponseData {
  items: ForumItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const forumService = {
  getForums: async (page = 1, limit = 20) => {
    return http.get<ApiResponse<ForumsResponseData>>(endpoints.privateMembers.forums({ page, limit }));
  },

  getForumPosts: async (forumId: string, page = 1, limit = 20, includePending = 'no') => {
    return http.get<ApiResponse<ForumPostsResponseData>>(
      `/private/forums/${encodeURIComponent(forumId)}/posts?page=${page}&limit=${limit}&includePending=${includePending}`,
    );
  },

  getPostComments: async (postId: string) => {
    return http.get<ApiResponse<ForumComment[]>>(
      `/private/posts/${encodeURIComponent(postId)}/comments`,
    );
  },

  createComment: async (postId: string, content: string) => {
    return http.post<ApiResponse<ForumComment>, { content: string }>(
      `/private/posts/${encodeURIComponent(postId)}/comments`,
      { content },
    );
  },

  deleteComment: async (commentId: string) => {
    return http.delete<ApiResponse<null>>(
      `/private/posts/comments/${encodeURIComponent(commentId)}`,
    );
  },

  deletePost: async (postId: string) => {
    return http.delete<ApiResponse<null>>(
      `/private/forums/posts/${encodeURIComponent(postId)}`,
    );
  },

  createPost: async (
    forumId: string,
    data: { title: string; content: string; postType: string; mediaFileIds: string[] },
  ) => {
    return http.post<ApiResponse<ForumPost>, typeof data>(
      `/private/forums/${encodeURIComponent(forumId)}/posts`,
      data,
    );
  },
};
