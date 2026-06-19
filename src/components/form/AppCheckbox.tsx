import { Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';
import { colors } from '../../theme';
import { AppText } from '../common';

export interface AppCheckboxProps extends Omit<PressableProps, 'children'> {
  checked?: boolean;
  label?: string;
  error?: string;
  style?: ViewStyle | ViewStyle[];
}

export function AppCheckbox({ checked = false, label, error, style, ...props }: AppCheckboxProps) {
  return (
    <View style={styles.wrap}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} style={[styles.row, style]} {...props}>
        <View style={[styles.box, checked && styles.checkedBox]}>{checked ? <View style={styles.check} /> : null}</View>
        {label ? (
          <AppText color="textSecondary" variant="bodyMedium">
            {label}
          </AppText>
        ) : null}
      </Pressable>
      {error ? (
        <AppText color="error" variant="bodySmall">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  box: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  checkedBox: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  check: {
    width: 8,
    height: 5,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.surface,
    transform: [{ rotate: '-45deg' }],
  },
});
