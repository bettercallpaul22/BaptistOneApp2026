import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { tokenStore } from '../services/api';

interface NativeAuthSessionContextValue {
  clearNativeSession: () => void;
  completeWebLogout: () => void;
  isWebLogoutPending: boolean;
  logoutVersion: number;
  logout: () => void;
}

const NativeAuthSessionContext = createContext<NativeAuthSessionContextValue | null>(null);

export const NativeAuthSessionProvider = ({ children }: { children: ReactNode }) => {
  const [isWebLogoutPending, setIsWebLogoutPending] = useState(false);
  const [logoutVersion, setLogoutVersion] = useState(0);

  const logout = useCallback(() => {
    tokenStore.clear();
    setIsWebLogoutPending(true);
    setLogoutVersion((value) => value + 1);
  }, []);

  const clearNativeSession = useCallback(() => {
    tokenStore.clear();
  }, []);

  const completeWebLogout = useCallback(() => {
    setIsWebLogoutPending(false);
  }, []);

  const value = useMemo(
    () => ({ clearNativeSession, completeWebLogout, isWebLogoutPending, logout, logoutVersion }),
    [clearNativeSession, completeWebLogout, isWebLogoutPending, logout, logoutVersion],
  );

  return <NativeAuthSessionContext.Provider value={value}>{children}</NativeAuthSessionContext.Provider>;
};

export const useNativeAuthSession = () => {
  const context = useContext(NativeAuthSessionContext);

  if (!context) {
    throw new Error('useNativeAuthSession must be used inside NativeAuthSessionProvider');
  }

  return context;
};
