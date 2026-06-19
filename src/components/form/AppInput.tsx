import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { colors, spacing } from '../../theme';
import { AppText } from '../common';

export interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export const AppInput = forwardRef<TextInput, AppInputProps>(
  ({ label, error, helperText, secureTextEntry, editable = true, style, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = Boolean(secureTextEntry);

    return (
      <View style={[styles.field, !editable && styles.disabled]}>
        {label ? <AppText variant="label">{label}</AppText> : null}
        <View style={[styles.control, error && styles.invalid]}>
          <TextInput
            ref={ref}
            editable={editable}
            placeholderTextColor="#8A96AA"
            secureTextEntry={isPassword && !showPassword}
            style={[styles.input, style]}
            {...props}
          />
          {isPassword ? (
            <Pressable disabled={!editable} onPress={() => setShowPassword((value) => !value)} style={styles.toggle}>
              <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </Pressable>
          ) : null}
        </View>
        {error || helperText ? (
          <AppText color={error ? 'error' : 'textMuted'} variant="bodySmall">
            {error ?? helperText}
          </AppText>
        ) : null}
      </View>
    );
  },
);

AppInput.displayName = 'AppInput';

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  control: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  invalid: {
    borderColor: colors.error,
  },
  input: {
    minWidth: 0,
    flex: 1,
    color: colors.primaryDark,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toggle: {
    paddingHorizontal: spacing.md,
  },
  toggleText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
});
