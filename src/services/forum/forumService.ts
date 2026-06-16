import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type { ApiResponse } from '@/types/api';

export interface ForumMember {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface ForumPost {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
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
};
