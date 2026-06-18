import { apiClient } from '@/services/api/axios';
import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type { ApiResponse } from '@/types/api';

export interface LatestUpdate {
  id: string;
  title: string;
  summary: string;
  date: string;
}

export interface HomeChurchContentMediaFile {
  id: string;
  url: string | null;
  altText?: string | null;
}

export interface HomeChurchContentTextOverlay {
  enabled: boolean;
  color: string;
  opacity: number;
}

export interface HomeChurchContentItem {
  id: string;
  title: string;
  scriptureReference: string | null;
  scriptureText: string | null;
  message: string | null;
  postedAt: string | null;
  createdAt: string | null;
  mediaFiles: HomeChurchContentMediaFile[];
  renderHints?: {
    textOverlay?: HomeChurchContentTextOverlay | null;
  } | null;
}

export interface DailyScripture {
  text: string;
  reference: string;
  version?: string;
}

const ourMannaDailyVerseUrl = 'https://beta.ourmanna.com/api/v1/get/?format=json&order=daily';

const getNestedString = (value: unknown, path: string[]) => {
  let current = value;

  for (const key of path) {
    if (!current || typeof current !== 'object' || !(key in current)) return null;
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === 'string' && current.trim() ? current.trim() : null;
};

const parseDailyScripture = (payload: unknown): DailyScripture => {
  const text =
    getNestedString(payload, ['verse', 'details', 'text']) ||
    getNestedString(payload, ['verse', 'text']) ||
    getNestedString(payload, ['text']);
  const reference =
    getNestedString(payload, ['verse', 'details', 'reference']) ||
    getNestedString(payload, ['verse', 'reference']) ||
    getNestedString(payload, ['reference']);
  const version =
    getNestedString(payload, ['verse', 'details', 'version']) ||
    getNestedString(payload, ['verse', 'version']) ||
    getNestedString(payload, ['version']) ||
    undefined;

  if (!text || !reference) {
    throw new Error('Unable to read daily scripture.');
  }

  return { text, reference, version };
};

export const homeService = {
  getUpdates: async () => {
    const { data } = await apiClient.get<LatestUpdate[]>(endpoints.home.updates);
    return data;
  },
  getDevotionalContent: async () => {
    const response = await http.get<ApiResponse<HomeChurchContentItem[]>>(
      endpoints.privateMembers.churchContent('DEVOTIONAL', { page: 1, limit: 20 }),
    );

    if (!response.status || !Array.isArray(response.data)) {
      throw new Error(response.message || 'Unable to load devotional content.');
    }

    return response.data;
  },
  getDailyScripture: async () => {
    const response = await fetch(ourMannaDailyVerseUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Unable to load daily scripture.');
    }

    return parseDailyScripture(await response.json());
  },
};
