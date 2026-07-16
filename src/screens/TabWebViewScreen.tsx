import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppText } from '../components/common';
import { SplashLogo } from '../components/SplashLogo';
import { baseWebUrl, getTabWebUrl, type WebTabName } from '../config/webRoutes';
import { useDeepLink } from '../navigation/DeepLinkContext';
import { useNativeAuthSession } from '../navigation/NativeAuthSessionContext';
import { colors, spacing } from '../theme';

const GOOGLE_AUTH_URL_MARKERS = ['/auth/google/sign-in', '/auth/google/sign-up'];

const nativeShellBootstrapScript = `
  window.__BAPTIST_ONE_NATIVE_SHELL__ = true;
  try {
    window.sessionStorage.setItem('baptistOne:nativeShell', '1');
  } catch (error) {}
  true;
`;

const webLogoutScript = `
  try {
    window.localStorage.removeItem('newbaptist.accessToken');
    window.localStorage.removeItem('newbaptist.refreshToken');
    window.sessionStorage.removeItem('newbaptist.accessToken');
    window.sessionStorage.removeItem('newbaptist.refreshToken');
    window.dispatchEvent(new Event('storage'));
    if (!window.location.pathname.startsWith('/auth')) {
      window.location.replace('/auth/login?nativeShell=1');
    }
  } catch (error) {}
  true;
`;

const isGoogleAuthNavigation = (url: string): boolean => {
  // Don't intercept the callback URL - it should load in the WebView
  if (url.includes('/auth/google/callback')) {
    return false;
  }
  return GOOGLE_AUTH_URL_MARKERS.some((marker) => url.includes(marker));
};

export function TabWebViewScreen({ tabName }: { tabName: WebTabName }) {
  const { clearNativeSession, completeWebLogout, isWebLogoutPending, logoutVersion } = useNativeAuthSession();
  const { pendingGoogleIntent, consumeGoogleIntent } = useDeepLink();
  const webViewRef = useRef<WebView>(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const [webLogoutVersion, setWebLogoutVersion] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [googleCallbackUrl, setGoogleCallbackUrl] = useState<string | null>(null);
  const url = getTabWebUrl(tabName);
  const source = useMemo(
    () => ({ uri: googleCallbackUrl ?? url }),
    [googleCallbackUrl, url],
  );
  const injectedJavaScriptBeforeContentLoaded = useMemo(
    () => `${nativeShellBootstrapScript}\n${logoutVersion > 0 && webLogoutVersion === logoutVersion ? webLogoutScript : ''}`,
    [logoutVersion, webLogoutVersion],
  );

  const retry = useCallback(() => {
    setHasError(false);
    setWebViewKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (isWebLogoutPending && logoutVersion > 0 && webLogoutVersion !== logoutVersion) {
      webViewRef.current?.injectJavaScript(webLogoutScript);
      setWebLogoutVersion(logoutVersion);
      setWebViewKey((value) => value + 1);
    }
  }, [isWebLogoutPending, logoutVersion, webLogoutVersion]);

  useEffect(() => {
    if (pendingGoogleIntent) {
      const callbackUrl = `${baseWebUrl.replace(/\/+$/, '')}/auth/google/callback?intent=${encodeURIComponent(pendingGoogleIntent)}`;
      setGoogleCallbackUrl(callbackUrl);
      consumeGoogleIntent();
    }
  }, [pendingGoogleIntent, consumeGoogleIntent]);

  const openGoogleAuthInSystemBrowser = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {});
  }, []);

  const handleShouldStartLoad = useCallback(
    (event: any): boolean => {
      const requestUrl = event?.url ?? event?.nativeEvent?.url ?? '';

      if (isGoogleAuthNavigation(requestUrl)) {
        openGoogleAuthInSystemBrowser(requestUrl);
        return false;
      }

      return true;
    },
    [openGoogleAuthInSystemBrowser],
  );

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data) as { type?: string; url?: string };

        if (payload.type === 'google-auth-complete') {
          setGoogleCallbackUrl(null);
          return;
        }

        if (payload.type === 'google-auth' && payload.url) {
          openGoogleAuthInSystemBrowser(payload.url);
          return;
        }

        if (payload.type === 'baptist-one:logout') {
          clearNativeSession();
        }
      } catch {
        // Ignore messages that do not belong to the native shell bridge.
      }
    },
    [clearNativeSession, openGoogleAuthInSystemBrowser],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        {hasError ? (
          <View style={styles.errorState}>
            <AppText align="center" variant="h3">
              Unable to load {tabName}
            </AppText>
            <AppText align="center" color="textSecondary" variant="bodyMedium">
               Something went wrong while loading the page. Please check your internet connection and try again.
            </AppText>
            <AppButton onPress={retry}>Retry</AppButton>
          </View>
        ) : (
          <WebView
            key={webViewKey}
            ref={webViewRef}
            source={source}
            style={styles.webview}
            applicationNameForUserAgent="BaptistOneNativeShell"
            allowsBackForwardNavigationGestures
            allowsInlineMediaPlayback
            cacheEnabled
            domStorageEnabled
            injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
            javaScriptEnabled
            pullToRefreshEnabled
            setSupportMultipleWindows={false}
            sharedCookiesEnabled
            startInLoadingState
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            onError={() => setHasError(true)}
            onHttpError={(event) => {
              if (event.nativeEvent.statusCode >= 500) {
                setHasError(true);
              }
            }}
            onLoadStart={() => setHasError(false)}
            onLoadEnd={() => {
              if (webLogoutVersion === logoutVersion) {
                completeWebLogout();
                setWebLogoutVersion(0);
              }
            }}
            onMessage={handleWebViewMessage}
            renderLoading={() => (
              <View style={styles.loading}>
                <SplashLogo />
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    zIndex: 0,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.surface,
    zIndex: 0,
    elevation: 0,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
});
