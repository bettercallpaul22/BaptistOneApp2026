import { createAsyncThunk } from '@reduxjs/toolkit';
import { toApiError } from '@/services/api/responseHandler';
import { homeService, type HomeChurchContentItem } from '@/services/home/homeService';

export const fetchUpdatesThunk = createAsyncThunk('home/fetchUpdates', async (_, { rejectWithValue }) => {
  try {
    return await homeService.getUpdates();
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export interface HomeDevotionalBanner {
  source: 'church' | 'daily-scripture';
  title?: string;
  text: string;
  reference: string;
  imageUrl?: string | null;
  overlay?: {
    enabled: boolean;
    color: string;
    opacity: number;
  } | null;
}

export interface FetchDevotionalBannerResult {
  items: HomeChurchContentItem[];
  latestDevotional: HomeChurchContentItem | null;
  banner: HomeDevotionalBanner | null;
  lastFetchedAt: string;
}

const getTimestamp = (value?: string | null) => {
  if (!value) return 0;

  const normalizedValue = value.includes(' ') ? value.replace(' ', 'T') : value;
  const timestamp = Date.parse(normalizedValue);

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getMostRecentDevotional = (items: HomeChurchContentItem[]) =>
  [...items].sort((first, second) => {
    const firstTimestamp = getTimestamp(first.postedAt) || getTimestamp(first.createdAt);
    const secondTimestamp = getTimestamp(second.postedAt) || getTimestamp(second.createdAt);

    return secondTimestamp - firstTimestamp;
  })[0] ?? null;

const getTrimmedValue = (value?: string | null) => value?.trim() || null;

const normalizeChurchDevotional = (item: HomeChurchContentItem): HomeDevotionalBanner | null => {
  const text = getTrimmedValue(item.message) || getTrimmedValue(item.scriptureText);
  const reference = getTrimmedValue(item.scriptureReference);

  if (!text || !reference) return null;

  return {
    source: 'church',
    title: getTrimmedValue(item.title) ?? undefined,
    text,
    reference,
    imageUrl: item.mediaFiles.find((mediaFile) => getTrimmedValue(mediaFile.url))?.url ?? null,
    overlay: item.renderHints?.textOverlay ?? null,
  };
};

export const fetchDevotionalBannerThunk = createAsyncThunk<
  FetchDevotionalBannerResult,
  void,
  { rejectValue: ReturnType<typeof toApiError> }
>('home/fetchDevotionalBanner', async (_, { rejectWithValue }) => {
  let churchContentError: unknown = null;

  try {
    const items = await homeService.getDevotionalContent();
    const latestDevotional = getMostRecentDevotional(items);
    const banner = latestDevotional ? normalizeChurchDevotional(latestDevotional) : null;

    if (banner) {
      return {
        items,
        latestDevotional,
        banner,
        lastFetchedAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    churchContentError = error;
  }

  try {
    const dailyScripture = await homeService.getDailyScripture();
    const reference = dailyScripture.version
      ? `${dailyScripture.reference} (${dailyScripture.version})`
      : dailyScripture.reference;

    return {
      items: [],
      latestDevotional: null,
      banner: {
        source: 'daily-scripture',
        text: dailyScripture.text,
        reference,
        imageUrl: null,
        overlay: null,
      },
      lastFetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return rejectWithValue(toApiError(churchContentError ?? error));
  }
});
