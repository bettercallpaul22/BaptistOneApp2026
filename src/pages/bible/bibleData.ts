import kjvData from '@/assets/bible/EN-English/kjv.json';
import englishBooksData from '@/assets/bible/Extras/books_en.json';

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
  | 'bishops'
  | 'coverdale'
  | 'geneva'
  | 'kjv'
  | 'kjv_strongs'
  | 'net'
  | 'tyndale'
  | 'web';

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

const translationOrder: BibleTranslationId[] = [
  'kjv',
  'web',
  'asv',
  'net',
  'geneva',
  'bishops',
  'coverdale',
  'tyndale',
  'kjv_strongs',
  'asvs',
];

const defaultBibleModule = kjvData as BibleModule;

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
  bishops: {
    id: 'bishops',
    name: 'Bishops Bible',
    shortName: 'Bishops',
    module: 'bishops',
  },
  coverdale: {
    id: 'coverdale',
    name: 'Coverdale Bible',
    shortName: 'Coverdale',
    module: 'coverdale',
  },
  geneva: {
    id: 'geneva',
    name: 'Geneva Bible',
    shortName: 'Geneva',
    module: 'geneva',
  },
  kjv: {
    id: 'kjv',
    name: defaultBibleModule.metadata.name,
    shortName: defaultBibleModule.metadata.shortname,
    module: defaultBibleModule.metadata.module,
  },
  kjv_strongs: {
    id: 'kjv_strongs',
    name: 'KJV with Strongs',
    shortName: 'KJV Strongs',
    module: 'kjv_strongs',
  },
  net: {
    id: 'net',
    name: 'NET Bible',
    shortName: 'NET',
    module: 'net',
  },
  tyndale: {
    id: 'tyndale',
    name: 'Tyndale Bible',
    shortName: 'Tyndale',
    module: 'tyndale',
  },
  web: {
    id: 'web',
    name: 'World English Bible',
    shortName: 'WEB',
    module: 'web',
  },
};

const bibleModuleLoaders: Record<BibleTranslationId, () => Promise<BibleModule>> = {
  asv: async () => ((await import('@/assets/bible/EN-English/asv.json')).default as BibleModule),
  asvs: async () => ((await import('@/assets/bible/EN-English/asvs.json')).default as BibleModule),
  bishops: async () => ((await import('@/assets/bible/EN-English/bishops.json')).default as BibleModule),
  coverdale: async () => ((await import('@/assets/bible/EN-English/coverdale.json')).default as BibleModule),
  geneva: async () => ((await import('@/assets/bible/EN-English/geneva.json')).default as BibleModule),
  kjv: async () => defaultBibleModule,
  kjv_strongs: async () => ((await import('@/assets/bible/EN-English/kjv_strongs.json')).default as BibleModule),
  net: async () => ((await import('@/assets/bible/EN-English/net.json')).default as BibleModule),
  tyndale: async () => ((await import('@/assets/bible/EN-English/tyndale.json')).default as BibleModule),
  web: async () => ((await import('@/assets/bible/EN-English/web.json')).default as BibleModule),
};

const bibleBooks = englishBooksData as BibleBook[];
const chapterRefs: BibleChapterRef[] = [];
const chapterCountByBook = new Map<number, number>();
const loadedBibleModules: Partial<Record<BibleTranslationId, BibleModule>> = {
  kjv: defaultBibleModule,
};
const bibleIndexes = new Map<BibleTranslationId, BibleIndex>();

const getChapterKey = (book: number, chapter: number) => `${book}:${chapter}`;

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

const getBibleModule = async (id: BibleTranslationId) => {
  const loadedModule = loadedBibleModules[id];

  if (loadedModule) return loadedModule;

  const module = await bibleModuleLoaders[id]();
  loadedBibleModules[id] = module;

  return module;
};

const getBibleIndex = async (id: BibleTranslationId) => {
  const existingIndex = bibleIndexes.get(id);

  if (existingIndex) return existingIndex;

  const index = createBibleIndex(await getBibleModule(id));
  bibleIndexes.set(id, index);

  return index;
};

bibleIndexes.set('kjv', createBibleIndex(defaultBibleModule));

const chapterRefKeys = new Set<string>();

for (const verse of defaultBibleModule.verses) {
  const key = getChapterKey(verse.book, verse.chapter);

  if (!chapterRefKeys.has(key)) {
    chapterRefKeys.add(key);
    chapterRefs.push({ book: verse.book, chapter: verse.chapter });
  }

  const currentChapterCount = chapterCountByBook.get(verse.book) ?? 0;

  if (verse.chapter > currentChapterCount) {
    chapterCountByBook.set(verse.book, verse.chapter);
  }
}

const chapterIndexByKey = new Map(chapterRefs.map((chapterRef, index) => [getChapterKey(chapterRef.book, chapterRef.chapter), index]));

export const defaultBibleReference: BibleChapterRef = {
  book: 42,
  chapter: 1,
};

export const defaultBibleTranslationId: BibleTranslationId = 'kjv';

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
