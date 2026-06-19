import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';

interface BottomTabVisibilityContextValue {
  isTabBarHidden: boolean;
  setIsTabBarHidden: (hidden: boolean) => void;
  tabBarHeight: number;
  setTabBarHeight: (height: number) => void;
}

const BottomTabVisibilityContext = createContext<BottomTabVisibilityContextValue | null>(null);

export function BottomTabVisibilityProvider({ children }: { children: ReactNode }) {
  const [isTabBarHidden, setIsTabBarHidden] = useState(false);
  const [tabBarHeight, setTabBarHeight] = useState(0);

  const value = useMemo(
    () => ({
      isTabBarHidden,
      setIsTabBarHidden,
      tabBarHeight,
      setTabBarHeight,
    }),
    [isTabBarHidden, tabBarHeight],
  );

  return <BottomTabVisibilityContext.Provider value={value}>{children}</BottomTabVisibilityContext.Provider>;
}

export function useBottomTabVisibility() {
  const context = useContext(BottomTabVisibilityContext);

  if (!context) {
    throw new Error('useBottomTabVisibility must be used within BottomTabVisibilityProvider');
  }

  return context;
}
