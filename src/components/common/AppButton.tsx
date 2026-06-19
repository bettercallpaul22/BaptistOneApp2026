import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps, type ViewStyle } from 'react-native';
import { colors } from '../../theme';

export type AppButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type AppButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps extends PressableProps {
  children: ReactNode;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle | ViewStyle[];
}

const variantStyles = StyleSheet.create({
  primary: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  secondary: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondary,
  },
  outline: {
    borderColor: '#D6DEEB',
    backgroundColor: colors.surface,
  },
  ghost: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  danger: {
    borderColor: colors.error,
    backgroundColor: colors.error,
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    minHeight: 36,
    paddingHorizontal: 14,
  },
  md: {
    minHeight: 44,
    paddingHorizontal: 20,
  },
  lg: {
    minHeight: 50,
    paddingHorizontal: 24,
  },
});

const labelColor: Record<AppButtonVariant, string> = {
  primary: colors.surface,
  secondary: colors.primaryDark,
  outline: colors.primary,
  ghost: colors.primary,
  danger: colors.surface,
};

const labelSize: Record<AppButtonSize, number> = {
  sm: 12,
  md: 14,
  lg: 16,
};

export function AppButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  style,
  ...props
}: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color={labelColor[variant]} size="small" /> : leftIcon}
      <View style={styles.labelWrap}>
        <Text numberOfLines={1} style={[styles.label, { color: labelColor[variant], fontSize: labelSize[size] }]}>
          {children}
        </Text>
      </View>
      {!loading ? rightIcon : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.65,
  },
  pressed: {
    transform: [{ translateY: -1 }],
  },
  labelWrap: {
    minWidth: 0,
    flexShrink: 1,
  },
  label: {
    fontWeight: '700',
  },
});
