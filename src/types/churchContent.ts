export type ChurchContentType = 'DEVOTIONAL' | 'SUNDAY_SCHOOL' | 'BIBLE_VERSE';

export interface ChurchContentMediaFile {
  id: string;
  url: string | null;
  altText?: string | null;
}

export interface ChurchContentTextOverlay {
  enabled: boolean;
  color: string;
  opacity: number;
}

export interface ChurchContentItem {
  id: string;
  title: string;
  scriptureReference: string | null;
  scriptureText: string | null;
  message: string | null;
  postedAt: string | null;
  createdAt: string | null;
  mediaFiles: ChurchContentMediaFile[];
  renderHints?: {
    textOverlay?: ChurchContentTextOverlay | null;
  } | null;
}

export interface ChurchContentMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ChurchContentApiResponse {
  data?: {
    items?: ChurchContentItem[];
    meta?: ChurchContentMeta;
  };
  items?: ChurchContentItem[];
  meta?: ChurchContentMeta;
  status?: boolean;
  message?: string;
}

export interface FetchChurchContentPayload {
  type: ChurchContentType;
  page?: number;
  limit?: number;
}
