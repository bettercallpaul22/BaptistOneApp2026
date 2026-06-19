import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../components/common';
import { NativeIcon, type NativeIconName } from '../../../components/NativeIcon';
import {
  cleanBibleVerseText,
  defaultBibleReference,
  defaultBibleTranslationId,
  formatChapterTitle,
  getBibleBook,
  getBibleBooks,
  getBibleTranslation,
  getBibleTranslations,
  getChapterVerses,
  getNextChapterRef,
  getPreviousChapterRef,
  type BibleBook,
  type BibleChapterRef,
  type BibleSearchResult,
  type BibleTranslation,
  type BibleTranslationId,
} from '../bibleData';
import { useBottomTabVisibility } from '../../../navigation/BottomTabVisibilityContext';
import { colors, spacing } from '../../../theme';
import { BibleSearchScreen } from './BibleSearchScreen';

const scriptureFontSize = 19;
const scrollToggleThreshold = 12;
const topScrollResetOffset = 16;

export function BibleReaderScreen() {
  const { isTabBarHidden, setIsTabBarHidden, tabBarHeight } = useBottomTabVisibility();
  const [reference, setReference] = useState<BibleChapterRef>(defaultBibleReference);
  const [translationId, setTranslationId] = useState<BibleTranslationId>(defaultBibleTranslationId);
  const [showBooks, setShowBooks] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [bookSearch, setBookSearch] = useState('');
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [targetVerse, setTargetVerse] = useState<number | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readerScrollRef = useRef<ScrollView>(null);
  const scrollAnchorOffset = useRef(0);
  const verseOffsets = useRef<Record<number, number>>({});
  const chapterBarTranslateY = useSharedValue(0);

  const bibleTranslation = useMemo(() => getBibleTranslation(translationId), [translationId]);
  const bibleTranslations = useMemo(() => getBibleTranslations(), []);
  const verses = useMemo(() => getChapterVerses(reference, translationId), [reference, translationId]);
  const books = useMemo(() => getBibleBooks(), []);
  const filteredBooks = useMemo(() => {
    const searchValue = bookSearch.trim().toLowerCase();

    if (!searchValue) return books;

    return books.filter((book) => {
      const aliases = [book.name, book.shortname, book.matching1, book.matching2].filter(Boolean).join(' ');

      return aliases.toLowerCase().includes(searchValue);
    });
  }, [bookSearch, books]);
  const currentBook = useMemo(() => getBibleBook(reference.book), [reference.book]);
  const chapterTitle = useMemo(() => formatChapterTitle(reference), [reference]);
  const previousChapter = useMemo(() => getPreviousChapterRef(reference), [reference]);
  const nextChapter = useMemo(() => getNextChapterRef(reference), [reference]);
  const lineHeight = Math.round(scriptureFontSize * 1.5);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }

      setIsTabBarHidden(false);
    };
  }, [setIsTabBarHidden]);

  useEffect(() => {
    verseOffsets.current = {};
  }, [reference, translationId]);

  useEffect(() => {
    chapterBarTranslateY.value = withTiming(isTabBarHidden ? 0 : -tabBarHeight, { duration: 220 });
  }, [chapterBarTranslateY, isTabBarHidden, tabBarHeight]);

  const chapterBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chapterBarTranslateY.value }],
  }));

  const handleReaderScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentOffset = Math.max(0, event.nativeEvent.contentOffset.y);

      if (currentOffset <= topScrollResetOffset) {
        scrollAnchorOffset.current = currentOffset;
        setIsTabBarHidden(false);
        return;
      }

      const offsetDelta = currentOffset - scrollAnchorOffset.current;

      if (offsetDelta > scrollToggleThreshold) {
        scrollAnchorOffset.current = currentOffset;
        setIsTabBarHidden(true);
      } else if (offsetDelta < -scrollToggleThreshold) {
        scrollAnchorOffset.current = currentOffset;
        setIsTabBarHidden(false);
      }
    },
    [setIsTabBarHidden],
  );

  const scrollToVerse = useCallback((verseNumber: number) => {
    const verseOffset = verseOffsets.current[verseNumber];

    if (verseOffset === undefined) return false;

    readerScrollRef.current?.scrollTo({
      animated: true,
      y: Math.max(0, verseOffset - spacing.md),
    });
    setHighlightedVerse(verseNumber);

    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }

    highlightTimerRef.current = setTimeout(() => setHighlightedVerse(null), 2600);

    return true;
  }, []);

  useEffect(() => {
    if (targetVerse === null) return;

    requestAnimationFrame(() => {
      if (scrollToVerse(targetVerse)) {
        setTargetVerse(null);
      }
    });
  }, [scrollToVerse, targetVerse, verses]);

  const openSearch = () => {
    setIsTabBarHidden(false);
    setShowSearch(true);
  };

  const closeSearch = () => {
    setIsTabBarHidden(false);
    setShowSearch(false);
  };

  const handleSearchResult = (result: BibleSearchResult) => {
    setIsTabBarHidden(false);
    setShowSearch(false);
    setReference({ book: result.book, chapter: result.chapter });
    setTargetVerse(result.verse);
    scrollAnchorOffset.current = 0;
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.actions}>
          <IconButton accessibilityLabel="Audio unavailable" icon="volume" />
          <IconButton accessibilityLabel="Search Bible" icon="search" onPress={openSearch} />
          <IconButton accessibilityLabel="More Bible options" icon="more-horizontal" />
          <Pressable
            accessibilityLabel="Switch Bible version"
            accessibilityRole="button"
            onPress={() => setShowVersions(true)}
            style={({ pressed }) => [styles.versionPill, pressed && styles.pressed]}
          >
            <NativeIcon color={colors.surface} name="globe" size={14} strokeWidth={2.1} />
            <AppText color="textInverse" style={styles.versionText} variant="label" weight="bold">
              {bibleTranslation.shortName}
            </AppText>
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={readerScrollRef}
        contentContainerStyle={[styles.readerContent, { paddingBottom: 118 + tabBarHeight }]}
        onScroll={handleReaderScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.readerScroll}
      >
        <View style={styles.chapterHero}>
          <AppText align="center" color="textMuted" style={styles.heroBookName} variant="h4" weight="bold">
            {currentBook?.name ?? 'Book'}
          </AppText>
          <Text style={styles.heroChapterNumber}>{reference.chapter}</Text>
          <AppText align="center" color="textMuted" variant="bodySmall">
            {bibleTranslation.name}
          </AppText>
        </View>

        <View style={styles.verses}>
          {verses.length > 0 ? (
            verses.map((verse) => (
              <View
                key={`${verse.chapter}-${verse.verse}`}
                onLayout={(event) => {
                  verseOffsets.current[verse.verse] = event.nativeEvent.layout.y;

                  if (targetVerse === verse.verse) {
                    requestAnimationFrame(() => {
                      if (scrollToVerse(verse.verse)) {
                        setTargetVerse(null);
                      }
                    });
                  }
                }}
                style={[styles.verseRow, highlightedVerse === verse.verse && styles.highlightedVerse]}
              >
                <Text style={[styles.scriptureText, { fontSize: scriptureFontSize, lineHeight }]}>
                  <Text style={[styles.verseNumber, { fontSize: Math.max(11, scriptureFontSize - 9), lineHeight }]}>
                    {verse.verse}
                  </Text>
                  {` ${cleanBibleVerseText(verse.text)}`}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyPassage}>
              <AppText align="center" color="textSecondary" variant="bodyLarge">
                This passage is not available in {bibleTranslation.shortName}.
              </AppText>
            </View>
          )}
        </View>
      </ScrollView>

      <Animated.View style={[styles.chapterBar, chapterBarStyle]}>
        <View style={styles.chapterControl}>
          <ChapterButton
            disabled={!previousChapter}
            label="‹"
            onPress={() => {
              if (previousChapter) setReference(previousChapter);
            }}
          />
          <Pressable
            accessibilityLabel="Choose Bible book"
            accessibilityRole="button"
            onPress={() => setShowBooks(true)}
            style={({ pressed }) => [styles.chapterLabelButton, pressed && styles.pressed]}
          >
            <AppText align="center" color="textPrimary" style={styles.chapterLabel} variant="bodyLarge" weight="bold">
              {chapterTitle}
            </AppText>
          </Pressable>
          <ChapterButton
            disabled={!nextChapter}
            label="›"
            onPress={() => {
              if (nextChapter) setReference(nextChapter);
            }}
          />
        </View>
      </Animated.View>

      <BooksPickerModal
        books={filteredBooks}
        currentBook={reference.book}
        onClose={() => setShowBooks(false)}
        onSearchChange={setBookSearch}
        onSelectBook={(book) => {
          setReference({ book: book.id, chapter: 1 });
          setBookSearch('');
          setShowBooks(false);
        }}
        searchValue={bookSearch}
        visible={showBooks}
      />
      <BibleSearchScreen
        onClose={closeSearch}
        onSelectResult={handleSearchResult}
        translationId={translationId}
        visible={showSearch}
      />
      <VersionsPickerModal
        currentTranslationId={translationId}
        onClose={() => setShowVersions(false)}
        onSelectTranslation={(translation) => {
          setTranslationId(translation.id);
          setShowVersions(false);
        }}
        translations={bibleTranslations}
        visible={showVersions}
      />
    </SafeAreaView>
  );
}

function IconButton({
  accessibilityLabel,
  icon,
  onPress,
}: {
  accessibilityLabel: string;
  icon: NativeIconName;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <NativeIcon color={colors.primaryDark} name={icon} size={21} strokeWidth={2.35} />
    </Pressable>
  );
}

function BooksPickerModal({
  books,
  currentBook,
  onClose,
  onSearchChange,
  onSelectBook,
  searchValue,
  visible,
}: {
  books: BibleBook[];
  currentBook: number;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onSelectBook: (book: BibleBook) => void;
  searchValue: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <SafeAreaView edges={['top']} style={styles.booksScreen}>
        <View style={styles.booksHeader}>
          <Pressable accessibilityLabel="Close books" accessibilityRole="button" onPress={onClose} style={styles.booksHeaderButton}>
            <NativeIcon color={colors.primaryDark} name="arrow-left" size={30} strokeWidth={2.5} />
          </Pressable>
          <AppText style={styles.booksTitle} variant="h2" weight="bold">
            Books
          </AppText>
          <View style={styles.booksHeaderActions}>
            <Pressable accessibilityRole="button" style={styles.booksHeaderButton}>
              <AppText color="textPrimary" variant="subtitle" weight="bold">
                A-Z
              </AppText>
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.booksHeaderButton}>
              <NativeIcon color={colors.primaryDark} name="clock" size={25} strokeWidth={2.4} />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchBox}>
          <NativeIcon color={colors.textMuted} name="search" size={25} strokeWidth={2.4} />
          <TextInput
            autoCapitalize="none"
            clearButtonMode="while-editing"
            onChangeText={onSearchChange}
            placeholder="Search"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={searchValue}
          />
        </View>

        <ScrollView contentContainerStyle={styles.booksList} showsVerticalScrollIndicator={false}>
          {books.map((book) => {
            const isSelected = book.id === currentBook;

            return (
              <Pressable
                accessibilityRole="button"
                key={book.id}
                onPress={() => onSelectBook(book)}
                style={({ pressed }) => [styles.bookRow, isSelected && styles.selectedBookRow, pressed && styles.pressed]}
              >
                <AppText color="textPrimary" style={styles.bookName} variant="h4" weight={isSelected ? 'bold' : 'medium'}>
                  {book.name}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function VersionsPickerModal({
  currentTranslationId,
  onClose,
  onSelectTranslation,
  translations,
  visible,
}: {
  currentTranslationId: BibleTranslationId;
  onClose: () => void;
  onSelectTranslation: (translation: BibleTranslation) => void;
  translations: BibleTranslation[];
  visible: boolean;
}) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.versionOverlay}>
        <Pressable style={styles.versionSheet}>
          <View style={styles.versionSheetHeader}>
            <View>
              <AppText variant="h4" weight="bold">
                Bible Version
              </AppText>
              <AppText color="textMuted" variant="bodySmall">
                Choose from available local translations
              </AppText>
            </View>
            <Pressable accessibilityLabel="Close Bible versions" accessibilityRole="button" onPress={onClose} style={styles.versionCloseButton}>
              <AppText align="center" variant="h4" weight="bold">
                ×
              </AppText>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.versionList} showsVerticalScrollIndicator={false}>
            {translations.map((translation) => {
              const isSelected = translation.id === currentTranslationId;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={translation.id}
                  onPress={() => onSelectTranslation(translation)}
                  style={({ pressed }) => [
                    styles.versionRow,
                    isSelected && styles.selectedVersionRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.versionAbbreviation}>
                    <AppText
                      align="center"
                      color="textInverse"
                      numberOfLines={1}
                      variant="label"
                      weight="bold"
                    >
                      {translation.shortName}
                    </AppText>
                  </View>
                  <View style={styles.versionRowText}>
                    <AppText color="textPrimary" numberOfLines={1} variant="bodyLarge" weight="bold">
                      {translation.shortName}
                    </AppText>
                    <AppText color="textMuted" numberOfLines={2} variant="bodySmall">
                      {translation.name}
                    </AppText>
                  </View>
                  {isSelected ? (
                    <AppText color="primary" variant="subtitle" weight="bold">
                      Active
                    </AppText>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ChapterButton({ disabled, label, onPress }: { disabled: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.chapterButton, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={styles.chapterButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },
  versionPill: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.smMd,
  },
  versionText: {
    lineHeight: 16,
  },
  readerScroll: {
    flex: 1,
  },
  readerContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 118,
  },
  chapterHero: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  heroBookName: {
    fontFamily: 'Georgia',
    letterSpacing: 0,
  },
  heroChapterNumber: {
    color: colors.textPrimary,
    fontFamily: 'Georgia',
    fontSize: 72,
    fontWeight: '800',
    lineHeight: 82,
  },
  verses: {
    width: '100%',
    maxWidth: 560,
    gap: spacing.smMd,
  },
  emptyPassage: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  scriptureText: {
    color: colors.textPrimary,
    fontFamily: 'Georgia',
    includeFontPadding: false,
    textAlign: 'left',
  },
  verseNumber: {
    color: colors.primary,
    fontFamily: 'Georgia',
    fontWeight: '800',
  },
  verseRow: {
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  highlightedVerse: {
    backgroundColor: colors.primaryLight,
  },
  chapterBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  chapterControl: {
    minHeight: 52,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
  },
  chapterButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  chapterButtonText: {
    color: colors.primaryDark,
    fontSize: 32,
    lineHeight: 34,
  },
  chapterLabelButton: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    paddingHorizontal: spacing.sm,
  },
  chapterLabel: {
    width: '100%',
  },
  booksScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  booksHeader: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  booksHeaderButton: {
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  booksTitle: {
    flex: 1,
  },
  booksHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchBox: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smMd,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 29,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 26,
    paddingVertical: spacing.sm,
  },
  booksList: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  bookRow: {
    minHeight: 58,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  selectedBookRow: {
    backgroundColor: colors.primaryLight,
  },
  bookName: {
    lineHeight: 30,
  },
  versionOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  versionSheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.background,
    paddingTop: spacing.lg,
  },
  versionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  versionCloseButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
  },
  versionList: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  versionRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smMd,
  },
  selectedVersionRow: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  versionAbbreviation: {
    minWidth: 66,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.sm,
  },
  versionRowText: {
    flex: 1,
    gap: spacing.xxs,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.35,
  },
});
