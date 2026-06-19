import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../common';
import { MenuAssetIcon, type MenuAssetIconName } from './MenuAssetIcon';
import { NativeIcon, type NativeIconName } from '../NativeIcon';
import { colors, spacing } from '../../theme';

export type QuickAccessTone = 'primary' | 'gold' | 'plain';

export interface QuickAccessItem {
  label: string;
  icon: NativeIconName;
  assetIcon?: MenuAssetIconName;
  tone?: QuickAccessTone;
  onPress?: () => void;
}

interface QuickAccessGridProps {
  items: QuickAccessItem[];
  columns?: number;
}

const toneStyles: Record<QuickAccessTone, { card: object; iconColor: string; labelColor: string }> = {
  primary: {
    card: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
    },
    iconColor: colors.textInverse,
    labelColor: colors.textInverse,
  },
  gold: {
    card: {
      borderColor: colors.secondary,
      backgroundColor: colors.secondary,
      shadowColor: colors.secondary,
      shadowOpacity: 0.22,
    },
    iconColor: colors.textInverse,
    labelColor: colors.textInverse,
  },
  plain: {
    card: {
      borderColor: colors.border,
      backgroundColor: colors.surface,
      shadowColor: colors.primaryDark,
      shadowOpacity: 0.08,
    },
    iconColor: colors.primary,
    labelColor: colors.primary,
  },
};

export function QuickAccessGrid({ items, columns = 3 }: QuickAccessGridProps) {
  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const tone = item.tone ?? 'plain';
        const resolvedTone = toneStyles[tone];

        return (
          <Pressable
            accessibilityRole="button"
            key={item.label}
            onPress={item.onPress}
            style={[styles.itemWrapper, { width: `${100 / columns}%` }]}
          >
            <View style={[styles.card, resolvedTone.card]}>
              {item.assetIcon ? (
                <MenuAssetIcon color={resolvedTone.iconColor} name={item.assetIcon} size={30} />
              ) : (
                <NativeIcon color={resolvedTone.iconColor} name={item.icon} size={30} strokeWidth={2.45} />
              )}
              <AppText
                align="center"
                color={resolvedTone.labelColor}
                numberOfLines={2}
                style={styles.label}
                variant="bodyMedium"
                weight="semibold"
              >
                {item.label}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
    rowGap: spacing.md,
  },
  itemWrapper: {
    paddingHorizontal: spacing.sm,
  },
  card: {
    aspectRatio: 1,
    minHeight: 98,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  label: {
    width: '100%',
    paddingHorizontal: spacing.xs,
    fontSize: 14,
    lineHeight: 18,
  },
});
