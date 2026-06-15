import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { BookOpen, ChevronLeft, ChevronRight, Loader2, Search, X } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppModal } from '@/components/feedback';
import { AppDropdown } from '@/components/form';
import {
  cleanBibleVerseText,
  defaultBibleReference,
  defaultBibleTranslationId,
  formatChapterTitle,
  getBibleBook,
  getBibleBooks,
  getBibleSearchSuggestions,
  getBibleTranslations,
  getChapterVerses,
  getChaptersForBook,
  getNextChapterRef,
  getPreviousChapterRef,
  isDefaultBibleCacheReady,
  prepareDefaultBibleCache,
  prepareRemainingBibleCache,
  searchBibleVerses,
  type BibleChapterRef,
  type BibleSearchResult,
  type BibleTranslationId,
  type BibleVerse,
} from './bibleData';

type PickerTab = 'book' | 'chapter';

const bibleBooks = getBibleBooks();
const bibleTranslations = getBibleTranslations();
const scrollToggleThreshold = 12;
const topScrollResetOffset = 16;

const isBibleTranslationId = (value: string): value is BibleTranslationId =>
  bibleTranslations.some((translation) => translation.id === value);

const VerseSkeleton = () => (
  <div className="grid gap-4 rounded-2xl border border-[#E5EAF3] bg-white p-5 shadow-[0_10px_24px_rgba(11,31,74,0.05)]">
    {Array.from({ length: 10 }, (_, index) => (
      <div className="flex animate-pulse gap-3" key={index}>
        <span className="size-7 rounded-full bg-[#E8EEF9]" />
        <span className="h-5 flex-1 rounded-full bg-[#EDF2FA]" />
      </div>
    ))}
  </div>
);

interface BiblePageProps {
  onBottomTabHiddenChange?: (hidden: boolean) => void;
}

export default function BibleReader({ onBottomTabHiddenChange }: BiblePageProps) {
  const [reference, setReference] = useState<BibleChapterRef>(defaultBibleReference);
  const [translationId, setTranslationId] = useState<BibleTranslationId>(defaultBibleTranslationId);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [isPreparingBibleData, setIsPreparingBibleData] = useState(() => !isDefaultBibleCacheReady());
  const [isChapterLoading, setIsChapterLoading] = useState(true);
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [pickerTab, setPickerTab] = useState<PickerTab>('book');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BibleSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isBottomTabHidden, setIsBottomTabHidden] = useState(false);
  const chapterTopRef = useRef<HTMLDivElement | null>(null);
  const scrollAnchorOffset = useRef(0);
  const isBottomTabHiddenRef = useRef(false);

  const selectedBook = getBibleBook(reference.book);
  const translationOptions = useMemo(
    () =>
      bibleTranslations.map((translation) => ({
        label: `${translation.shortName} - ${translation.name}`,
        value: translation.id,
      })),
    [],
  );
  const chaptersForSelectedBook = useMemo(() => getChaptersForBook(reference.book), [reference.book]);
  const previousChapterRef = useMemo(() => getPreviousChapterRef(reference), [reference]);
  const nextChapterRef = useMemo(() => getNextChapterRef(reference), [reference]);
  const chapterTitle = formatChapterTitle(reference);

  const setReaderBottomTabHidden = useCallback(
    (hidden: boolean) => {
      if (isBottomTabHiddenRef.current === hidden) return;

      isBottomTabHiddenRef.current = hidden;
      setIsBottomTabHidden(hidden);
      onBottomTabHiddenChange?.(hidden);
    },
    [onBottomTabHiddenChange],
  );

  useEffect(() => {
    const handleReaderScroll = () => {
      const currentOffset = Math.max(0, window.scrollY);

      if (currentOffset <= topScrollResetOffset) {
        scrollAnchorOffset.current = currentOffset;
        setReaderBottomTabHidden(false);
        return;
      }

      const offsetDelta = currentOffset - scrollAnchorOffset.current;

      if (offsetDelta > scrollToggleThreshold) {
        scrollAnchorOffset.current = currentOffset;
        setReaderBottomTabHidden(true);
      } else if (offsetDelta < -scrollToggleThreshold) {
        scrollAnchorOffset.current = currentOffset;
        setReaderBottomTabHidden(false);
      }
    };

    window.addEventListener('scroll', handleReaderScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleReaderScroll);
      setReaderBottomTabHidden(false);
    };
  }, [setReaderBottomTabHidden]);

  useEffect(() => {
    let isMounted = true;

    if (!isPreparingBibleData) {
      prepareRemainingBibleCache();
      return undefined;
    }

    prepareDefaultBibleCache().finally(() => {
      if (!isMounted) return;
      setIsPreparingBibleData(false);
      prepareRemainingBibleCache();
    });

    return () => {
      isMounted = false;
    };
  }, [isPreparingBibleData]);

  useEffect(() => {
    let isMounted = true;

    if (isPreparingBibleData) return undefined;

    getChapterVerses(reference, translationId)
      .then((chapterVerses) => {
        if (!isMounted) return;
        setVerses(chapterVerses);
      })
      .finally(() => {
        if (isMounted) setIsChapterLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isPreparingBibleData, reference, translationId]);

  useEffect(() => {
    if (!highlightedVerse || isChapterLoading) return;

    const target = document.getElementById(`bible-verse-${highlightedVerse}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const timeout = window.setTimeout(() => setHighlightedVerse(null), 2600);

    return () => window.clearTimeout(timeout);
  }, [highlightedVerse, isChapterLoading, verses]);

  useEffect(() => {
    let isMounted = true;

    if (searchQuery.trim().length < 2) return undefined;

    const timeout = window.setTimeout(() => {
      Promise.all([searchBibleVerses(searchQuery, translationId), getBibleSearchSuggestions(searchQuery, translationId)])
        .then(([results, nextSuggestions]) => {
          if (!isMounted) return;
          setSearchResults(results);
          setSuggestions(nextSuggestions);
        })
        .finally(() => {
          if (isMounted) setIsSearchLoading(false);
        });
    }, 180);

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [searchQuery, translationId]);

  const goToReference = (nextReference: BibleChapterRef) => {
    setIsChapterLoading(true);
    setReference(nextReference);
    setHighlightedVerse(null);
    window.requestAnimationFrame(() => {
      chapterTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleBookSelect = (book: number) => {
    setIsChapterLoading(true);
    setReference({ book, chapter: 1 });
    setPickerTab('chapter');
  };

  const handleChapterSelect = (chapter: number) => {
    setIsChapterLoading(true);
    setReference((currentReference) => ({ ...currentReference, chapter }));
    setIsPickerOpen(false);
  };

  const handleTranslationChange = (value: string) => {
    if (isBibleTranslationId(value)) {
      setIsChapterLoading(true);
      setTranslationId(value);
    }
  };

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    setIsSearchLoading(value.trim().length >= 2);
  };

  const handleSearchResultSelect = (result: BibleSearchResult) => {
    setIsChapterLoading(true);
    setReference({ book: result.book, chapter: result.chapter });
    setHighlightedVerse(result.verse);
    setIsSearchOpen(false);
  };

  return (
    <>
      <div className="min-h-[calc(100vh-4rem)] overflow-x-hidden bg-[#F6F8FC] px-4 pt-5 pb-36 sm:px-6 md:px-9 md:py-8 md:pb-32">
        <div className="mx-auto grid max-w-[78rem] min-w-0 gap-5">
          <section className="grid min-w-0 gap-4 rounded-2xl border border-[#E5EAF3] bg-white p-5 shadow-[0_12px_30px_rgba(11,31,74,0.08)] sm:p-6">
            <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid min-w-0 gap-2">
                <div className="flex items-center gap-3 text-[#123B8D]">
                  <span className="grid size-11 place-items-center rounded-xl bg-[#EAF1FF]">
                    <BookOpen className="size-6" aria-hidden />
                  </span>
                  <AppText variant="h1">Bible</AppText>
                </div>
                <AppText variant="bodyLarge" color="textSecondary">
                  Read and search scripture across English translations.
                </AppText>
              </div>

              <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
                <AppDropdown
                  label="Translation"
                  options={translationOptions}
                  value={translationId}
                  searchable
                  onChange={(value) => {
                    if (typeof value === 'string') handleTranslationChange(value);
                  }}
                />
                <div className="flex min-w-0 flex-wrap items-end gap-2">
                  <AppButton variant="outline" leftIcon={<BookOpen className="size-4" aria-hidden />} onClick={() => setIsPickerOpen(true)}>
                    {chapterTitle}
                  </AppButton>
                  <AppButton variant="secondary" leftIcon={<Search className="size-4" aria-hidden />} onClick={() => setIsSearchOpen(true)}>
                    Search
                  </AppButton>
                </div>
              </div>
            </div>
          </section>

          <section ref={chapterTopRef} className="grid min-w-0 gap-4 rounded-2xl border border-[#E5EAF3] bg-white p-5 shadow-[0_10px_24px_rgba(11,31,74,0.05)] sm:p-7">
            <div className="border-b border-[#EEF2F7] pb-4">
              <div className="grid gap-1">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#D4A017]">{selectedBook?.shortname ?? 'Bible'}</p>
                <h2 className="m-0 text-3xl font-black tracking-[0] text-[#0B1F4A] sm:text-4xl">{chapterTitle}</h2>
              </div>
            </div>

            {isPreparingBibleData ? (
              <div className="grid min-h-[22rem] place-items-center rounded-2xl border border-[#E5EAF3] bg-[#F8FAFC] p-6 text-center">
                <div className="grid justify-items-center gap-3">
                  <span className="grid size-14 place-items-center rounded-2xl bg-[#EAF1FF] text-[#123B8D]">
                    <Loader2 className="size-7 animate-spin" aria-hidden />
                  </span>
                  <div className="grid gap-1">
                    <AppText variant="h6" align="center">
                      Loading your Bible data
                    </AppText>
                    <AppText variant="bodySmall" color="textSecondary" align="center">
                      Preparing scripture for faster reading next time.
                    </AppText>
                  </div>
                </div>
              </div>
            ) : isChapterLoading ? (
              <VerseSkeleton />
            ) : (
              <article className="grid gap-4">
                {verses.map((verse) => (
                  <p
                    className={`m-0 rounded-xl px-3 py-2 text-lg leading-8 text-[#24344D] transition sm:text-xl sm:leading-9 ${
                      highlightedVerse === verse.verse ? 'bg-[#FFF4D4] ring-2 ring-[#D4A017]/50' : ''
                    }`}
                    id={`bible-verse-${verse.verse}`}
                    key={`${verse.book}-${verse.chapter}-${verse.verse}`}
                  >
                    <sup className="mr-2 align-super text-sm font-black text-[#123B8D]">{verse.verse}</sup>
                    {cleanBibleVerseText(verse.text)}
                  </p>
                ))}
              </article>
            )}
          </section>
        </div>
      </div>

      <div
        className={clsx(
          'fixed right-0 left-0 z-40 px-7 pb-3 transition-[bottom] duration-[220ms] ease-out md:left-[18rem] md:bottom-5',
          isBottomTabHidden
            ? 'bottom-[calc(0.65rem+env(safe-area-inset-bottom))]'
            : 'bottom-[calc(4.95rem+env(safe-area-inset-bottom))]',
        )}
      >
        <div className="mx-auto grid max-w-[30rem] grid-cols-[3rem_1fr_3rem] items-center rounded-full border border-[#D9E3F5] bg-[#EAF1FF]/95 px-2 py-2 text-[#0B1F4A] shadow-[0_12px_30px_rgba(11,31,74,0.14)] backdrop-blur">
          <button
            className="grid size-11 place-items-center rounded-full text-[#123B8D] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
            type="button"
            aria-label="Previous chapter"
            disabled={!previousChapterRef}
            onClick={() => previousChapterRef && goToReference(previousChapterRef)}
          >
            <ChevronLeft className="size-7" strokeWidth={3} aria-hidden />
          </button>
          <button
            className="min-w-0 truncate rounded-full px-3 py-2 text-center text-base font-black text-[#0B1F4A] transition hover:bg-white/70"
            type="button"
            onClick={() => setIsPickerOpen(true)}
          >
            {chapterTitle}
          </button>
          <button
            className="grid size-11 place-items-center rounded-full text-[#123B8D] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
            type="button"
            aria-label="Next chapter"
            disabled={!nextChapterRef}
            onClick={() => nextChapterRef && goToReference(nextChapterRef)}
          >
            <ChevronRight className="size-7" strokeWidth={3} aria-hidden />
          </button>
        </div>
      </div>

      <AppModal
        open={isPickerOpen}
        title="Choose passage"
        onClose={() => setIsPickerOpen(false)}
        footer={
          <AppButton variant="ghost" onClick={() => setIsPickerOpen(false)}>
            Close
          </AppButton>
        }
      >
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#F2F5FA] p-1">
            <button
              className={`min-h-10 rounded-md text-sm font-black transition ${
                pickerTab === 'book' ? 'bg-white text-[#123B8D] shadow-sm' : 'text-[#5A6780]'
              }`}
              type="button"
              onClick={() => setPickerTab('book')}
            >
              Book
            </button>
            <button
              className={`min-h-10 rounded-md text-sm font-black transition ${
                pickerTab === 'chapter' ? 'bg-white text-[#123B8D] shadow-sm' : 'text-[#5A6780]'
              }`}
              type="button"
              onClick={() => setPickerTab('chapter')}
            >
              Chapter
            </button>
          </div>

          {pickerTab === 'book' ? (
            <div className="max-h-[58vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {bibleBooks.map((book) => (
                  <button
                    className={`min-h-12 rounded-lg border px-3 text-left text-sm font-bold transition ${
                      book.id === reference.book
                        ? 'border-[#123B8D] bg-[#EAF1FF] text-[#123B8D]'
                        : 'border-[#E5EAF3] bg-white text-[#24344D] hover:border-[#B8C6E4]'
                    }`}
                    key={book.id}
                    type="button"
                    onClick={() => handleBookSelect(book.id)}
                  >
                    {book.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
              {chaptersForSelectedBook.map((chapter) => (
                <button
                  className={`aspect-square rounded-lg border text-sm font-black transition ${
                    chapter === reference.chapter
                      ? 'border-[#123B8D] bg-[#123B8D] text-white'
                      : 'border-[#E5EAF3] bg-white text-[#123B8D] hover:border-[#B8C6E4]'
                  }`}
                  key={chapter}
                  type="button"
                  onClick={() => handleChapterSelect(chapter)}
                >
                  {chapter}
                </button>
              ))}
            </div>
          )}
        </div>
      </AppModal>

      <AppModal
        open={isSearchOpen}
        title="Search Bible"
        onClose={() => setIsSearchOpen(false)}
        footer={
          <AppButton variant="ghost" onClick={() => setIsSearchOpen(false)}>
            Close
          </AppButton>
        }
      >
        <div className="grid max-h-[68vh] min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
          <div className="grid gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-[#7B8798]" aria-hidden />
              <input
                className="min-h-12 w-full rounded-lg border border-[#D6DEEB] bg-white pr-11 pl-10 text-base font-semibold text-[#0B1F4A] outline-none transition placeholder:text-[#8A96A8] focus:border-[#123B8D] focus:ring-4 focus:ring-[#123B8D]/15"
                value={searchQuery}
                placeholder="Search words or book names"
                onChange={(event) => handleSearchQueryChange(event.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-[#46556E] transition hover:bg-[#F2F5FA]"
                  type="button"
                  aria-label="Clear search"
                  onClick={() => handleSearchQueryChange('')}
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </div>

            {searchQuery.trim().length >= 2 && suggestions.length > 0 && (
              <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
                {suggestions.map((suggestion) => (
                  <button
                    className="rounded-full bg-[#EAF1FF] px-3 py-1.5 text-sm font-bold text-[#123B8D]"
                    key={suggestion}
                    type="button"
                    onClick={() => handleSearchQueryChange(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-h-0 overflow-y-auto pr-1">
            {isSearchLoading ? (
              <div className="flex min-h-32 items-center justify-center gap-2 text-sm font-bold text-[#123B8D]">
                <Loader2 className="size-5 animate-spin" aria-hidden />
                Searching
              </div>
            ) : searchQuery.trim().length < 2 ? (
              <p className="m-0 rounded-xl bg-[#F6F8FC] p-4 text-sm font-medium text-[#5A6780]">Type at least two characters to search.</p>
            ) : searchResults.length === 0 ? (
              <p className="m-0 rounded-xl bg-[#F6F8FC] p-4 text-sm font-medium text-[#5A6780]">No Bible results found.</p>
            ) : (
              <div className="grid gap-2">
                {searchResults.map((result) => (
                  <button
                    className="grid gap-1 rounded-xl border border-[#E5EAF3] bg-white p-3 text-left transition hover:border-[#B8C6E4] hover:bg-[#F8FAFE]"
                    key={`${result.reference}-${result.preview}`}
                    type="button"
                    onClick={() => handleSearchResultSelect(result)}
                  >
                    <span className="text-sm font-black text-[#123B8D]">{result.reference}</span>
                    <span className="line-clamp-2 text-sm leading-6 text-[#46556E]">{result.preview}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppModal>
    </>
  );
}
