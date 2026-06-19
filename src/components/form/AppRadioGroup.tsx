import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { AppText } from '../common';

export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface AppRadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  label?: string;
  error?: string;
  onChange?: (value: string) => void;
}

export function AppRadioGroup({ options, value, label, error, onChange }: AppRadioGroupProps) {
  return (
    <View style={styles.group}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled: option.disabled }}
            disabled={option.disabled}
            key={option.value}
            onPress={() => onChange?.(option.value)}
            style={[styles.option, option.disabled && styles.disabled]}
          >
            <View style={[styles.dot, selected && styles.selectedDot]} />
            <AppText color="textSecondary" variant="bodyMedium">
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
      {error ? (
        <AppText color="error" variant="bodySmall">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 999,
  },
  selectedDot: {
    borderWidth: 5,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.55,
  },
});
