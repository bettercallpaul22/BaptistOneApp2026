import { storageKeys } from '@/constants/storage';
import { getContentCacheItem, setContentCacheItem } from '@/services/content/contentCache';

export interface HymnVerse {
  number: number;
  text: string;
}

export interface Hymn {
  id: string;
  number: number;
  title: string;
  verses: HymnVerse[];
}

export interface HymnSearchResult {
  hymn: Hymn;
  matchType: 'number' | 'title' | 'lyrics';
  preview: string;
}

const hymnalCacheVersion = 'v1';
const hymnalCacheId = `${hymnalCacheVersion}:hymnal`;
let loadedHymns: Hymn[] | null = null;

const canUseLocalStorage = () => typeof window !== 'undefined' && 'localStorage' in window;

export const isHymnalCacheReady = () => {
  if (!canUseLocalStorage()) return false;

  try {
    return window.localStorage.getItem(storageKeys.hymnalCache) === hymnalCacheVersion;
  } catch {
    return false;
  }
};

const markHymnalCacheReady = () => {
  if (!canUseLocalStorage()) return;

  try {
    window.localStorage.setItem(storageKeys.hymnalCache, hymnalCacheVersion);
  } catch {
    // Cache readiness is best effort; bundled JSON remains the fallback.
  }
};

const loadBundledHymns = async () => ((await import('@/assets/hymnal/hymnal.json')).default as Hymn[]);

const readCachedHymns = async () => {
  if (!isHymnalCacheReady()) return null;

  try {
    const cachedHymns = await getContentCacheItem<Hymn[]>('hymnal', hymnalCacheId);

    if (cachedHymns?.version !== hymnalCacheVersion) return null;

    return cachedHymns.value;
  } catch {
    return null;
  }
};

const persistHymns = async (hymns: Hymn[]) => {
  try {
    await setContentCacheItem('hymnal', {
      id: hymnalCacheId,
      version: hymnalCacheVersion,
      cachedAt: new Date().toISOString(),
      value: hymns,
    });
    markHymnalCacheReady();
  } catch {
    // IndexedDB is an optimization here. Keep the hymnal usable if it fails.
  }
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const splitLongLine = (line: string): string[] => {
  if (line.length <= 74) return [line];

  const commaIndex = line.lastIndexOf(',', 62);

  if (commaIndex >= 34) {
    return [line.slice(0, commaIndex + 1).trim(), ...splitLongLine(line.slice(commaIndex + 1).trim())];
  }

  const words = line.split(' ');
  const lines: string[] = [];
  let nextLine = '';

  for (const word of words) {
    const candidate = nextLine ? `${nextLine} ${word}` : word;

    if (candidate.length > 66 && nextLine) {
      lines.push(nextLine);
      nextLine = word;
    } else {
      nextLine = candidate;
    }
  }

  if (nextLine) lines.push(nextLine);

  return lines;
};

export const getCachedHymns = async () => {
  if (loadedHymns) return loadedHymns;

  const cachedHymns = await readCachedHymns();
  if (cachedHymns) {
    loadedHymns = cachedHymns;
    return cachedHymns;
  }

  const bundledHymns = await loadBundledHymns();
  loadedHymns = bundledHymns;
  void persistHymns(bundledHymns);

  return bundledHymns;
};

export const prepareHymnalCache = async () => {
  const hymns = await getCachedHymns();
  await persistHymns(hymns);

  return hymns;
};

export const getHymns = () => loadedHymns ?? [];

export const getHymnById = (id: string) => getHymns().find((hymn) => hymn.id === id);

export const formatHymnVerseLines = (text: string) => {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  const phraseLines = normalizedText
    .split(/(?<=[;:!?])\s+|(?<=\.)\s+(?=[A-Z"'])/g)
    .map((line) => line.trim())
    .filter(Boolean);

  return phraseLines.flatMap(splitLongLine);
};

export const searchHymns = (hymns: Hymn[], query: string, limit = Infinity): HymnSearchResult[] => {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return hymns.map((hymn) => ({
      hymn,
      matchType: 'title',
      preview: `${hymn.verses.length} verses`,
    }));
  }

  const results: HymnSearchResult[] = [];

  for (const hymn of hymns) {
    const hymnNumber = String(hymn.number);
    const normalizedTitle = normalizeText(hymn.title);

    if (hymnNumber.includes(normalizedQuery)) {
      results.push({
        hymn,
        matchType: 'number',
        preview: `Hymn ${hymn.number}`,
      });
    } else if (normalizedTitle.includes(normalizedQuery)) {
      results.push({
        hymn,
        matchType: 'title',
        preview: hymn.title,
      });
    } else {
      const matchedVerse = hymn.verses.find((verse) => normalizeText(verse.text).includes(normalizedQuery));

      if (matchedVerse) {
        results.push({
          hymn,
          matchType: 'lyrics',
          preview: matchedVerse.text,
        });
      }
    }

    if (results.length >= limit) break;
  }

  return results;
};
