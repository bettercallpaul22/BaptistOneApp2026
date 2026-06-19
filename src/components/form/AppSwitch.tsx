import { useState } from 'react';
import { Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';
import { colors } from '../../theme';
import { AppText } from '../common';

export interface AppSwitchProps extends Omit<PressableProps, 'onPress'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  style?: ViewStyle | ViewStyle[];
}

export function AppSwitch({ checked, defaultChecked = false, onCheckedChange, label, disabled, style, ...props }: AppSwitchProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;

  const toggle = () => {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) setInternalChecked(next);
    onCheckedChange?.(next);
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: isChecked, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={toggle}
      style={[styles.switch, disabled && styles.disabled, style]}
      {...props}
    >
      <View style={[styles.track, isChecked && styles.checkedTrack]}>
        <View style={[styles.thumb, isChecked && styles.checkedThumb]} />
      </View>
      {label ? (
        <AppText color="textSecondary" variant="bodyMedium">
          {label}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  switch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    width: 40,
    height: 22,
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.borderStrong,
    padding: 3,
  },
  checkedTrack: {
    backgroundColor: colors.primary,
  },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: colors.surface,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  checkedThumb: {
    transform: [{ translateX: 18 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
