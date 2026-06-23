import englishBooksData from '@/assets/bible/Extras/books_en.json';
import { storageKeys } from '@/constants/storage';
import { getContentCacheItem, setContentCacheItem } from '@/services/content/contentCache';

export interface BibleBook {
  id: number;
  name: string;
  shortname: string;
  matching1: string | null;
  matching2: string | null;
}

export interface BibleVerse {
  book_name: string;
  book: number;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleModule {
  metadata: {
    name: string;
    shortname: string;
    module: string;
  };
  verses: BibleVerse[];
}

export interface BibleChapterRef {
  book: number;
  chapter: number;
}

export type BibleTranslationId =
  | 'asv'
  | 'asvs'
  | 'kjv';

export interface BibleTranslation {
  id: BibleTranslationId;
  name: string;
  shortName: string;
  module: string;
}

export interface BibleSearchResult extends BibleChapterRef {
  verse: number;
  bookName: string;
  preview: string;
  reference: string;
  translationId: BibleTranslationId;
  translationShortName: string;
}

interface BibleIndex {
  module: BibleModule;
  versesByChapter: Map<string, BibleVerse[]>;
}

interface BibleCacheMetadata {
  version: string;
  readyTranslations: BibleTranslationId[];
  cachedAt: string;
}

const translationOrder: BibleTranslationId[] = [
  'kjv',
  'asv',
  'asvs',
];

const translationMetadata: Record<BibleTranslationId, BibleTranslation> = {
  asv: {
    id: 'asv',
    name: 'American Standard Version',
    shortName: 'ASV',
    module: 'asv',
  },
  asvs: {
    id: 'asvs',
    name: "American Standard Version w Strong's",
    shortName: 'ASVs',
    module: 'asvs',
  },
  kjv: {
    id: 'kjv',
    name: 'King James Version',
    shortName: 'KJV',
    module: 'kjv',
  },
};

const bibleModuleLoaders: Record<BibleTranslationId, () => Promise<BibleModule>> = {
  asv: async () => ((await import('@/assets/bible/EN-English/asv.json')).default as BibleModule),
  asvs: async () => ((await import('@/assets/bible/EN-English/asvs.json')).default as BibleModule),
  kjv: async () => ((await import('@/assets/bible/EN-English/kjv.json')).default as BibleModule),
};

const bibleBooks = englishBooksData as BibleBook[];
const canonicalChapterCounts = [
  50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150, 31, 12, 8,
  66, 52, 5, 48, 12, 14, 3, 9, 1, 4, 7, 3, 3, 3, 2, 14, 4, 28, 16, 24, 21, 28, 16, 16,
  13, 6, 6, 4, 4, 5, 3, 6, 4, 3, 1, 13, 5, 5, 3, 5, 1, 1, 1, 22,
];
const chapterRefs: BibleChapterRef[] = [];
const chapterCountByBook = new Map<number, number>();
const loadedBibleModules: Partial<Record<BibleTranslationId, BibleModule>> = {};
const bibleIndexes = new Map<BibleTranslationId, BibleIndex>();
const bibleCacheVersion = 'v1';
let remainingBibleCacheStarted = false;

const getChapterKey = (book: number, chapter: number) => `${book}:${chapter}`;
const getBibleCacheId = (id: BibleTranslationId) => `${bibleCacheVersion}:${id}`;

const canUseLocalStorage = () => typeof window !== 'undefined' && 'localStorage' in window;

const readBibleCacheMetadata = (): BibleCacheMetadata | null => {
  if (!canUseLocalStorage()) return null;

  try {
    const value = window.localStorage.getItem(storageKeys.bibleCache);
    if (!value) return null;

    const metadata = JSON.parse(value) as Partial<BibleCacheMetadata>;
    if (metadata.version !== bibleCacheVersion || !Array.isArray(metadata.readyTranslations)) return null;

    return {
      version: bibleCacheVersion,
      readyTranslations: metadata.readyTranslations.filter((id): id is BibleTranslationId =>
        translationOrder.includes(id as BibleTranslationId),
      ),
      cachedAt: typeof metadata.cachedAt === 'string' ? metadata.cachedAt : '',
    };
  } catch {
    return null;
  }
};

const writeBibleCacheMetadata = (metadata: BibleCacheMetadata) => {
  if (!canUseLocalStorage()) return;

  try {
    window.localStorage.setItem(storageKeys.bibleCache, JSON.stringify(metadata));
  } catch {
    // Cache metadata is best effort; bundled JSON remains the fallback.
  }
};

const isBibleTranslationCacheReady = (id: BibleTranslationId) =>
  readBibleCacheMetadata()?.readyTranslations.includes(id) ?? false;

export const isDefaultBibleCacheReady = () => isBibleTranslationCacheReady(defaultBibleTranslationId);

const markBibleTranslationCacheReady = (id: BibleTranslationId) => {
  const current = readBibleCacheMetadata();
  const readyTranslations = new Set<BibleTranslationId>(current?.readyTranslations ?? []);

  readyTranslations.add(id);
  writeBibleCacheMetadata({
    version: bibleCacheVersion,
    readyTranslations: Array.from(readyTranslations),
    cachedAt: new Date().toISOString(),
  });
};

export const cleanBibleVerseText = (text: string) =>
  text
    .replace(/<[^>]*>/g, '')
    .replace(/\{[^}]+}/g, '')
    .replace(/[‹›¶]/g, '')
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const normalizeSearchText = (text: string) =>
  cleanBibleVerseText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const createBibleIndex = (module: BibleModule) => {
  const versesByChapter = new Map<string, BibleVerse[]>();

  for (const verse of module.verses) {
    const key = getChapterKey(verse.book, verse.chapter);
    const existingVerses = versesByChapter.get(key);

    if (existingVerses) {
      existingVerses.push(verse);
    } else {
      versesByChapter.set(key, [verse]);
    }
  }

  return { module, versesByChapter };
};

const readCachedBibleModule = async (id: BibleTranslationId) => {
  if (!isBibleTranslationCacheReady(id)) return null;

  try {
    const cachedModule = await getContentCacheItem<BibleModule>('bibleTranslations', getBibleCacheId(id));

    if (cachedModule?.version !== bibleCacheVersion) return null;

    return cachedModule.value;
  } catch {
    return null;
  }
};

const persistBibleModule = async (id: BibleTranslationId, module: BibleModule) => {
  try {
    await setContentCacheItem('bibleTranslations', {
      id: getBibleCacheId(id),
      version: bibleCacheVersion,
      cachedAt: new Date().toISOString(),
      value: module,
    });
    markBibleTranslationCacheReady(id);
  } catch {
    // IndexedDB is an optimization here. Keep the reader usable if it fails.
  }
};

const getBibleModule = async (id: BibleTranslationId) => {
  const loadedModule = loadedBibleModules[id];

  if (loadedModule) return loadedModule;

  const cachedModule = await readCachedBibleModule(id);
  if (cachedModule) {
    loadedBibleModules[id] = cachedModule;
    return cachedModule;
  }

  const module = await bibleModuleLoaders[id]();
  loadedBibleModules[id] = module;
  void persistBibleModule(id, module);

  return module;
};

const getBibleIndex = async (id: BibleTranslationId) => {
  const existingIndex = bibleIndexes.get(id);

  if (existingIndex) return existingIndex;

  const index = createBibleIndex(await getBibleModule(id));
  bibleIndexes.set(id, index);

  return index;
};

bibleBooks.forEach((book, index) => {
  const chapterCount = canonicalChapterCounts[index] ?? 0;
  chapterCountByBook.set(book.id, chapterCount);

  for (let chapter = 1; chapter <= chapterCount; chapter += 1) {
    chapterRefs.push({ book: book.id, chapter });
  }
});

const chapterIndexByKey = new Map(chapterRefs.map((chapterRef, index) => [getChapterKey(chapterRef.book, chapterRef.chapter), index]));

export const defaultBibleReference: BibleChapterRef = {
  book: 42,
  chapter: 1,
};

export const defaultBibleTranslationId: BibleTranslationId = 'kjv';

export const prepareDefaultBibleCache = async () => {
  const cachedModule = await readCachedBibleModule(defaultBibleTranslationId);

  if (cachedModule) {
    loadedBibleModules[defaultBibleTranslationId] = cachedModule;
    bibleIndexes.set(defaultBibleTranslationId, createBibleIndex(cachedModule));
    return;
  }

  const module = await bibleModuleLoaders[defaultBibleTranslationId]();
  loadedBibleModules[defaultBibleTranslationId] = module;
  bibleIndexes.set(defaultBibleTranslationId, createBibleIndex(module));
  await persistBibleModule(defaultBibleTranslationId, module);
};

export const prepareRemainingBibleCache = () => {
  if (remainingBibleCacheStarted) return;

  remainingBibleCacheStarted = true;

  void (async () => {
    for (const translationId of translationOrder.filter((id) => id !== defaultBibleTranslationId)) {
      await getBibleModule(translationId);
    }
  })();
};

export const getBibleTranslation = (id: BibleTranslationId): BibleTranslation => translationMetadata[id];

export const getBibleTranslations = () => translationOrder.map(getBibleTranslation);

export const getBibleBooks = () => bibleBooks;

export const getBibleBook = (bookId: number) => bibleBooks.find((book) => book.id === bookId);

export const getChapterCount = (bookId: number) => chapterCountByBook.get(bookId) ?? 0;

export const getChaptersForBook = (bookId: number) => Array.from({ length: getChapterCount(bookId) }, (_, index) => index + 1);

export const getChapterVerses = async (
  { book, chapter }: BibleChapterRef,
  translationId: BibleTranslationId = defaultBibleTranslationId,
) => (await getBibleIndex(translationId)).versesByChapter.get(getChapterKey(book, chapter)) ?? [];

export const searchBibleVerses = async (
  query: string,
  translationId: BibleTranslationId = defaultBibleTranslationId,
  limit = 50,
): Promise<BibleSearchResult[]> => {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length < 2) return [];

  const translation = getBibleTranslation(translationId);
  const verses = (await getBibleIndex(translationId)).module.verses;
  const results: BibleSearchResult[] = [];

  for (const verse of verses) {
    const preview = cleanBibleVerseText(verse.text);

    if (!normalizeSearchText(preview).includes(normalizedQuery)) continue;

    const bookName = getBibleBook(verse.book)?.name ?? verse.book_name;

    results.push({
      book: verse.book,
      bookName,
      chapter: verse.chapter,
      preview,
      reference: `${bookName} ${verse.chapter}:${verse.verse} ${translation.shortName}`,
      translationId,
      translationShortName: translation.shortName,
      verse: verse.verse,
    });

    if (results.length >= limit) break;
  }

  return results;
};

export const getBibleSearchSuggestions = async (
  query: string,
  translationId: BibleTranslationId = defaultBibleTranslationId,
  limit = 12,
) => {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length < 2) return [];

  const suggestions = new Set<string>();

  for (const book of bibleBooks) {
    if (normalizeSearchText(book.name).includes(normalizedQuery)) {
      suggestions.add(book.name);
    }

    if (suggestions.size >= limit) return Array.from(suggestions);
  }

  const verses = (await getBibleIndex(translationId)).module.verses;

  for (const verse of verses) {
    const words = normalizeSearchText(verse.text).split(' ');
    const matchIndex = words.findIndex((word) => word.includes(normalizedQuery));

    if (matchIndex < 0) continue;

    suggestions.add(words.slice(matchIndex, matchIndex + 4).join(' '));

    if (suggestions.size >= limit) break;
  }

  return Array.from(suggestions);
};

export const getPreviousChapterRef = ({ book, chapter }: BibleChapterRef) => {
  const index = chapterIndexByKey.get(getChapterKey(book, chapter));

  if (index === undefined || index <= 0) return null;

  return chapterRefs[index - 1];
};

export const getNextChapterRef = ({ book, chapter }: BibleChapterRef) => {
  const index = chapterIndexByKey.get(getChapterKey(book, chapter));

  if (index === undefined || index >= chapterRefs.length - 1) return null;

  return chapterRefs[index + 1];
};

export const formatChapterTitle = ({ book, chapter }: BibleChapterRef) => {
  const bibleBook = getBibleBook(book);

  return `${bibleBook?.name ?? 'Book'} ${chapter}`;
};
