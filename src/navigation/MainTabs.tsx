import { lazy, Suspense, useEffect } from 'react';
import { InteractionManager, Pressable, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TabActions } from '@react-navigation/native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeIcon, type NativeIconName } from '../components/NativeIcon';
import { AppText } from '../components/common';
import { SplashLogo } from '../components/SplashLogo';
import { TabWebViewScreen } from '../screens/TabWebViewScreen';
import { type WebTabName } from '../config/webRoutes';
import { colors } from '../theme';
import { BottomTabVisibilityProvider, useBottomTabVisibility } from './BottomTabVisibilityContext';

export type MainTabsParamList = {
  Home: undefined;
  Bible: undefined;
  Hymnal: undefined;
  Church: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

const loadBibleReaderScreen = () =>
  import('../features/bible/screens/BibleReaderScreen').then((module) => ({
    default: module.BibleReaderScreen,
  }));

const LazyBibleReaderScreen = lazy(loadBibleReaderScreen);

const tabIcons: Record<keyof MainTabsParamList, NativeIconName> = {
  Home: 'home',
  Bible: 'bible',
  Hymnal: 'music',
  Church: 'church',
  Profile: 'user',
};

function AnimatedTabItem({
  label,
  focused,
  onPressIn,
  onPress,
}: {
  label: keyof MainTabsParamList;
  focused: boolean;
  onPressIn: () => void;
  onPress: () => void;
}) {
  const icon = tabIcons[label];
  const lift = useSharedValue(0);
  const scale = useSharedValue(1);
  const indicator = useSharedValue(0);

  useEffect(() => {
    lift.value = withSpring(focused ? -5 : 0, { damping: 14, stiffness: 180 });
    scale.value = withSpring(focused ? 1.08 : 1, { damping: 12, stiffness: 220 });
    indicator.value = withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focused, indicator, lift, scale]);

  const itemStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicator.value,
    transform: [{ scaleX: indicator.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      onPressIn={onPressIn}
      onPress={onPress}
      style={styles.tabPressable}
    >
      <Animated.View style={[styles.tabItem, focused && styles.activeTabItem, itemStyle]}>
        <Animated.View style={[styles.iconBubble, focused && styles.activeIconBubble, iconStyle]}>
          <NativeIcon color={colors.primaryDark} name={icon} size={24} strokeWidth={2.4} />
        </Animated.View>
        <AppText
          color={focused ? 'textPrimary' : 'textSecondary'}
          numberOfLines={1}
          style={styles.tabLabel}
          variant="label"
        >
          {label}
        </AppText>
        <Animated.View style={[styles.indicator, indicatorStyle]} />
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isTabBarHidden, setIsTabBarHidden, setTabBarHeight, tabBarHeight } = useBottomTabVisibility();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const activeRouteName = state.routes[state.index]?.name;

  useEffect(() => {
    if (activeRouteName !== 'Bible') {
      setIsTabBarHidden(false);
    }
  }, [activeRouteName, setIsTabBarHidden]);

  useEffect(() => {
    translateY.value = withTiming(isTabBarHidden ? tabBarHeight + 24 : 0, { duration: 220 });
    opacity.value = withTiming(isTabBarHidden ? 0.15 : 1, { duration: 160 });
  }, [isTabBarHidden, opacity, tabBarHeight, translateY]);

  const tabBarStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      onLayout={(event) => setTabBarHeight(event.nativeEvent.layout.height)}
      pointerEvents={isTabBarHidden ? 'none' : 'auto'}
      style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }, tabBarStyle]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const options = descriptors[route.key]?.options;
        const label = (options?.title ?? route.name) as keyof MainTabsParamList;

        return (
          <AnimatedTabItem
            focused={focused}
            key={route.key}
            label={label}
            onPressIn={() => {
              console.log('[BottomTab] press in', {
                focused,
                route: route.name,
                tabBarHidden: isTabBarHidden,
                tabBarHeight,
              });
            }}
            onPress={() => {
              console.log('[BottomTab] press', {
                focused,
                route: route.name,
                tabBarHidden: isTabBarHidden,
                tabBarHeight,
              });
              setIsTabBarHidden(false);

              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              console.log('[BottomTab] tabPress emitted', {
                defaultPrevented: event.defaultPrevented,
                focused,
                route: route.name,
              });

              if (!focused && !event.defaultPrevented) {
                navigation.dispatch(TabActions.jumpTo(route.name));
                console.log('[BottomTab] jumpTo dispatched', { route: route.name });
              }
            }}
          />
        );
      })}
    </Animated.View>
  );
}

function BibleTabFallback() {
  return (
    <View style={styles.bibleFallback}>
      <SplashLogo />
    </View>
  );
}

export function MainTabs() {
  const tabNames: WebTabName[] = ['Home', 'Bible', 'Hymnal', 'Church', 'Profile'];

  useEffect(() => {
    const preloadTask = InteractionManager.runAfterInteractions(() => {
      void loadBibleReaderScreen();
    });

    return () => preloadTask.cancel();
  }, []);

  return (
    <BottomTabVisibilityProvider>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        {tabNames.map((tabName) => (
          <Tab.Screen key={tabName} name={tabName} options={{ title: tabName }}>
            {() =>
              tabName === 'Bible' ? (
                <Suspense fallback={<BibleTabFallback />}>
                  <LazyBibleReaderScreen />
                </Suspense>
              ) : (
                <TabWebViewScreen tabName={tabName} />
              )
            }
          </Tab.Screen>
        ))}
      </Tab.Navigator>
    </BottomTabVisibilityProvider>
  );
}

const styles = StyleSheet.create({
  bibleFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.surface,
  },
  tabBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingHorizontal: 8,
    paddingTop: 8,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -10 },
    elevation: 100,
    zIndex: 1000,
  },
  tabPressable: {
    flex: 1,
    zIndex: 1,
  },
  tabItem: {
    minHeight: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingTop: 5,
    paddingBottom: 5,
  },
  activeTabItem: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  iconBubble: {
    width: 34,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  activeIconBubble: {
    backgroundColor: colors.surface,
  },
  tabLabel: {
    marginTop: 2,
  },
  indicator: {
    width: 34,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.primary,
    marginTop: 5,
  },
});
