import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../components/common';
import { NativeIcon } from '../../../components/NativeIcon';
import {
  getBibleSearchSuggestions,
  searchBibleVerses,
  type BibleSearchResult,
  type BibleTranslationId,
} from '../bibleData';
import { colors, spacing } from '../../../theme';

interface BibleSearchScreenProps {
  onClose: () => void;
  onSelectResult: (result: BibleSearchResult) => void;
  translationId: BibleTranslationId;
  visible: boolean;
}

const filterChips = ['All', 'Bible', 'Plans', 'Videos', 'Churches'];

export function BibleSearchScreen({ onClose, onSelectResult, translationId, visible }: BibleSearchScreenProps) {
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

  const suggestions = useMemo(() => getBibleSearchSuggestions(query, translationId), [query, translationId]);
  const results = useMemo(() => searchBibleVerses(submittedQuery, translationId), [submittedQuery, translationId]);
  const showResults = submittedQuery.trim().length > 1;

  useEffect(() => {
    if (!visible) return;

    const focusTimer = setTimeout(() => inputRef.current?.focus(), 250);

    return () => clearTimeout(focusTimer);
  }, [visible]);

  const closeSearch = () => {
    setQuery('');
    setSubmittedQuery('');
    onClose();
  };

  const submitSearch = (value = query) => {
    const nextQuery = value.trim();

    if (nextQuery.length < 2) return;

    setQuery(nextQuery);
    setSubmittedQuery(nextQuery);
  };

  const clearSearch = () => {
    setQuery('');
    setSubmittedQuery('');
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <Modal animationType="slide" onRequestClose={closeSearch} visible={visible}>
      <SafeAreaView edges={['top']} style={styles.screen}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Close Bible search" accessibilityRole="button" onPress={closeSearch} style={styles.headerButton}>
            <NativeIcon color={colors.primaryDark} name="arrow-left" size={30} strokeWidth={2.5} />
          </Pressable>
          <TextInput
            ref={inputRef}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="never"
            onChangeText={(value) => {
              setQuery(value);
              setSubmittedQuery('');
            }}
            onSubmitEditing={() => submitSearch()}
            placeholder="Search Bible"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          <Pressable
            accessibilityLabel={query ? 'Clear Bible search' : 'Close Bible search'}
            accessibilityRole="button"
            onPress={query ? clearSearch : closeSearch}
            style={styles.headerButton}
          >
            <AppText align="center" color="textPrimary" style={styles.closeText} weight="bold">
              x
            </AppText>
          </Pressable>
        </View>

        {showResults ? (
          <View style={styles.resultsHeader}>
            <ScrollView contentContainerStyle={styles.chips} horizontal showsHorizontalScrollIndicator={false}>
              {filterChips.map((chip) => (
                <View key={chip} style={[styles.chip, chip === 'Bible' && styles.activeChip]}>
                  <AppText color={chip === 'Bible' ? 'textInverse' : 'textPrimary'} variant="label" weight="bold">
                    {chip}
                  </AppText>
                </View>
              ))}
            </ScrollView>
            <View style={styles.resultsTitleRow}>
              <AppText variant="h3" weight="bold">
                Bible
              </AppText>
              <AppText color="primary" variant="subtitle" weight="bold">
                Filter
              </AppText>
            </View>
            <View style={styles.filters}>
              <View style={styles.filterPill}>
                <AppText variant="bodyMedium">English</AppText>
              </View>
              <View style={styles.filterPill}>
                <AppText variant="bodyMedium">OT / NT</AppText>
              </View>
              <View style={styles.filterPill}>
                <AppText variant="bodyMedium">All books</AppText>
              </View>
            </View>
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={showResults ? styles.resultsList : styles.suggestionsList}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {showResults ? (
            <>
              {results.map((result) => (
                <Pressable
                  accessibilityRole="button"
                  key={`${result.translationId}-${result.book}-${result.chapter}-${result.verse}`}
                  onPress={() => {
                    onSelectResult(result);
                    setQuery('');
                    setSubmittedQuery('');
                  }}
                  style={({ pressed }) => [styles.resultRow, pressed && styles.pressed]}
                >
                  <View style={styles.resultAccent} />
                  <View style={styles.resultBody}>
                    <AppText color="textPrimary" numberOfLines={3} style={styles.resultPreview}>
                      {result.preview}
                    </AppText>
                    <AppText color="textSecondary" variant="subtitle" weight="bold">
                      {result.reference}
                    </AppText>
                  </View>
                </Pressable>
              ))}
              {results.length === 0 ? (
                <View style={styles.emptyState}>
                  <AppText align="center" variant="h4" weight="bold">
                    No Bible results
                  </AppText>
                  <AppText align="center" color="textSecondary" variant="bodyMedium">
                    Try a different word or phrase.
                  </AppText>
                </View>
              ) : null}
            </>
          ) : (
            suggestions.map((suggestion) => (
              <Pressable
                accessibilityRole="button"
                key={suggestion}
                onPress={() => submitSearch(suggestion)}
                style={({ pressed }) => [styles.suggestionRow, pressed && styles.pressed]}
              >
                <View style={styles.suggestionIcon}>
                  <NativeIcon color={colors.primaryDark} name="search" size={24} strokeWidth={2.4} />
                </View>
                <AppText color="textPrimary" numberOfLines={1} style={styles.suggestionText} variant="bodyLarge">
                  {suggestion}
                </AppText>
                <AppText align="center" color="textPrimary" style={styles.suggestionArrow} weight="bold">
                  ↖
                </AppText>
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  headerButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 28,
    paddingVertical: spacing.sm,
  },
  closeText: {
    fontSize: 26,
    lineHeight: 30,
  },
  suggestionsList: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  suggestionRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  suggestionIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
  },
  suggestionText: {
    flex: 1,
    fontSize: 20,
    lineHeight: 28,
  },
  suggestionArrow: {
    width: 34,
    fontSize: 24,
    lineHeight: 28,
  },
  resultsHeader: {
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  chips: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  chip: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.lg,
  },
  activeChip: {
    backgroundColor: colors.primaryDark,
  },
  resultsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  filterPill: {
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  resultsList: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  resultRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  resultAccent: {
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  resultBody: {
    flex: 1,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  resultPreview: {
    fontFamily: 'Georgia',
    fontSize: 21,
    lineHeight: 31,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.72,
  },
});
