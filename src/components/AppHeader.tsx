import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { AppText } from './common';
import { NativeIcon, type NativeIconName } from './NativeIcon';
import { colors, spacing } from '../theme';

type HeaderAction = 'menu' | 'back' | 'bell' | 'none';

interface AppHeaderProps {
  title: string;
  leftAction?: HeaderAction;
  rightAction?: HeaderAction;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  safeAreaTop?: boolean;
}

const actionIconMap: Record<Exclude<HeaderAction, 'none'>, NativeIconName> = {
  back: 'arrow-left',
  bell: 'bell',
  menu: 'menu',
};

function HeaderBackButtonIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 18 12" fill="none">
      <Path
        d="M7.942,12A5.023,5.023,0,0,1,6.6,11.592,22.626,22.626,0,0,1,1.006,7.8l-.379-.4a3.6,3.6,0,0,1-.281-.334A1.771,1.771,0,0,1,0,6.008,1.853,1.853,0,0,1,.375,4.87l.39-.42.087-.09A22.081,22.081,0,0,1,6.743.336L6.987.242A4.065,4.065,0,0,1,7.942,0a2,2,0,0,1,.91.22,1.883,1.883,0,0,1,.808.9,9.781,9.781,0,0,1,.261,1.065,22.351,22.351,0,0,1,.243,3.451v.354a27.187,27.187,0,0,1-.216,3.688l-.113.544a3.9,3.9,0,0,1-.233.784A1.815,1.815,0,0,1,8,12ZM12.8,7.191a1.191,1.191,0,0,1,0-2.381l3.7-.327a1.518,1.518,0,0,1,0,3.036Z"
        fill="#200E32"
      />
    </Svg>
  );
}

export function AppHeader({
  title,
  leftAction = 'menu',
  rightAction = 'bell',
  onLeftPress,
  onRightPress,
  safeAreaTop = true,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const leftIcon = leftAction === 'none' ? null : actionIconMap[leftAction];
  const rightIcon = rightAction === 'none' ? null : actionIconMap[rightAction];

  return (
    <View style={styles.header}>
      {safeAreaTop ? <View style={{ height: insets.top }} /> : null}
      <View style={styles.headerRow}>
        {leftIcon ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={leftAction === 'back' ? 'Go back' : 'Open menu'}
          hitSlop={10}
          onPress={onLeftPress}
          style={styles.plainAction}
        >
          {leftAction === 'back' ? (
            <HeaderBackButtonIcon />
          ) : (
            <NativeIcon color={colors.primary} name={leftIcon} size={30} strokeWidth={2.7} />
          )}
        </Pressable>
        ) : (
          <View style={styles.plainAction} />
        )}

        <AppText align="center" numberOfLines={1} style={styles.title} variant="h4">
          {title}
        </AppText>

        {rightIcon ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={rightAction === 'back' ? 'Go back' : 'Notifications'}
            hitSlop={10}
            onPress={onRightPress}
            style={rightAction === 'bell' ? styles.bellAction : styles.plainAction}
          >
            {rightAction === 'back' ? (
              <HeaderBackButtonIcon />
            ) : (
              <NativeIcon color={colors.primary} name={rightIcon} size={24} strokeWidth={2.7} />
            )}
            {rightAction === 'bell' ? <View style={styles.notificationDot} /> : null}
          </Pressable>
        ) : (
          <View style={styles.plainAction} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  plainAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.surface,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.12,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  title: {
    position: 'absolute',
    left: 72,
    right: 72,
    color: colors.primaryDark,
    // fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.error,
  },
});
