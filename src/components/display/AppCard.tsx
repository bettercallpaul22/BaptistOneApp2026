import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';

export interface AppCardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  style?: ViewStyle | ViewStyle[];
  contentStyle?: ViewStyle | ViewStyle[];
}

export function AppCard({ children, header, footer, style, contentStyle }: AppCardProps) {
  return (
    <View style={[styles.card, style]}>
      {header ? <View style={styles.header}>{header}</View> : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 2,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEF2F7',
    padding: spacing.md,
  },
  content: {
    padding: spacing.md,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEF2F7',
    padding: spacing.md,
  },
});
