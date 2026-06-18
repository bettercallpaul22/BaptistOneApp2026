import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type {
  ChurchContentApiResponse,
  ChurchContentItem,
  ChurchContentMeta,
  ChurchContentType,
  FetchChurchContentPayload,
} from '@/types/churchContent';

export type { ChurchContentItem, ChurchContentMeta, ChurchContentType };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeInteger = (value: unknown, fallback: number) => {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.trunc(numberValue)) : fallback;
};

const normalizeMeta = (meta: unknown, itemsLength: number): ChurchContentMeta => {
  const metaRecord = isRecord(meta) ? meta : {};
  const page = normalizeInteger(metaRecord.page, 1);
  const limit = normalizeInteger(metaRecord.limit, itemsLength || 1);
  const total = normalizeInteger(metaRecord.total, itemsLength);
  const calculatedTotalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  const totalPages = normalizeInteger(metaRecord.totalPages, calculatedTotalPages);

  return { page, limit, total, totalPages };
};

export const churchContentService = {
  getContent: async ({ type, page = 1, limit = 20 }: FetchChurchContentPayload) => {
    const response = await http.get<ChurchContentApiResponse>(
      endpoints.privateMembers.churchContent(type, { page, limit }),
    );

    if (response.status === false) {
      throw new Error(response.message || 'Unable to load content.');
    }

    const payload = response.data ?? response;
    const rawItems = payload.items ?? (Array.isArray(payload) ? payload : null);
    const rawMeta = payload.meta ?? null;

    if (!Array.isArray(rawItems)) {
      throw new Error(response.message || 'Unable to load content.');
    }

    return {
      items: rawItems as ChurchContentItem[],
      meta: normalizeMeta(rawMeta, rawItems.length),
    };
  },
};
