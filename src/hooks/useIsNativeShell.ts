import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const nativeShellStorageKey = 'baptistOne:nativeShell';
const nativeShellUserAgent = 'BaptistOneNativeShell';

const canUseBrowserApis = typeof window !== 'undefined';

type NativeShellWindow = Window & {
  __BAPTIST_ONE_NATIVE_SHELL__?: boolean;
};

const hasNativeShellFlag = () =>
  canUseBrowserApis && Boolean((window as NativeShellWindow).__BAPTIST_ONE_NATIVE_SHELL__);

const hasNativeUserAgent = () => canUseBrowserApis && window.navigator.userAgent.includes(nativeShellUserAgent);

const hasNativeShellSession = () => {
  if (!canUseBrowserApis) return false;

  try {
    return window.sessionStorage.getItem(nativeShellStorageKey) === '1';
  } catch {
    return false;
  }
};

const persistNativeShellSession = () => {
  if (!canUseBrowserApis) return;

  try {
    window.sessionStorage.setItem(nativeShellStorageKey, '1');
  } catch {
    // Storage can be unavailable in restrictive WebView/browser modes.
  }
};

export const useIsNativeShell = () => {
  const { search } = useLocation();
  const hasNativeShellQuery = new URLSearchParams(search).get('nativeShell') === '1';
  const isNativeShell = hasNativeShellQuery || hasNativeShellFlag() || hasNativeUserAgent() || hasNativeShellSession();

  useEffect(() => {
    if (isNativeShell) {
      persistNativeShellSession();
    }
  }, [isNativeShell]);

  return isNativeShell;
};
