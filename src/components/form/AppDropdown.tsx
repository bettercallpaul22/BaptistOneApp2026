import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { colors, spacing } from '../../theme';
import { AppButton, AppText } from '../common';

export interface DropdownOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface AppDropdownProps<TOption extends DropdownOption = DropdownOption> {
  label?: string;
  options: TOption[];
  value?: string | string[];
  placeholder?: string;
  searchable?: boolean;
  multi?: boolean;
  disabled?: boolean;
  error?: string;
  renderItem?: (option: TOption, selected: boolean) => string;
  onChange?: (value: string | string[]) => void;
}

export function AppDropdown<TOption extends DropdownOption>({
  label,
  options,
  value,
  placeholder = 'Select an option',
  searchable = false,
  multi = false,
  disabled = false,
  error,
  renderItem,
  onChange,
}: AppDropdownProps<TOption>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const values = useMemo(() => (Array.isArray(value) ? value : value ? [value] : []), [value]);
  const selectedLabel = options
    .filter((option) => values.includes(option.value))
    .map((option) => option.label)
    .join(', ');
  const filtered = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase())),
    [options, query],
  );

  const selectOption = (option: TOption) => {
    if (option.disabled) return;

    if (multi) {
      const next = values.includes(option.value)
        ? values.filter((item) => item !== option.value)
        : [...values, option.value];
      onChange?.(next);
      return;
    }

    onChange?.(option.value);
    setOpen(false);
  };

  return (
    <View style={styles.field}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.trigger, error && styles.invalid, disabled && styles.disabled]}
      >
        <AppText color={selectedLabel ? 'textPrimary' : 'textMuted'} numberOfLines={1} variant="bodyMedium">
          {selectedLabel || placeholder}
        </AppText>
        <AppText color="textPrimary" variant="bodyMedium">
          v
        </AppText>
      </Pressable>
      {error ? (
        <AppText color="error" variant="bodySmall">
          {error}
        </AppText>
      ) : null}

      <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet}>
            <AppText variant="h5">{label ?? placeholder}</AppText>
            {searchable ? (
              <TextInput
                autoFocus
                onChangeText={setQuery}
                placeholder="Search"
                placeholderTextColor="#8A96AA"
                style={styles.search}
                value={query}
              />
            ) : null}
            <ScrollView style={styles.list}>
              {filtered.map((option) => {
                const selected = values.includes(option.value);
                return (
                  <Pressable
                    disabled={option.disabled}
                    key={option.value}
                    onPress={() => selectOption(option)}
                    style={[styles.option, selected && styles.selectedOption, option.disabled && styles.disabled]}
                  >
                    <AppText color={selected ? 'primary' : 'textSecondary'} weight={selected ? 'bold' : undefined}>
                      {renderItem ? renderItem(option, selected) : option.label}
                    </AppText>
                    {selected ? <View style={styles.selectedIndicator} /> : null}
                  </Pressable>
                );
              })}
              {filtered.length === 0 ? (
                <AppText color="textMuted" style={styles.empty} variant="bodySmall">
                  No results found
                </AppText>
              ) : null}
            </ScrollView>
            {multi ? <AppButton onPress={() => setOpen(false)}>Done</AppButton> : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  trigger: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  invalid: {
    borderColor: colors.error,
  },
  disabled: {
    opacity: 0.55,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
    padding: spacing.md,
  },
  sheet: {
    maxHeight: '72%',
    gap: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  search: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.primaryDark,
    paddingHorizontal: 14,
  },
  list: {
    maxHeight: 280,
  },
  option: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  selectedOption: {
    backgroundColor: colors.primaryLight,
  },
  selectedIndicator: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  empty: {
    padding: spacing.sm,
  },
});
