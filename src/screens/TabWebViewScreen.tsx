import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppText } from '../components/common';
import { SplashLogo } from '../components/SplashLogo';
import { getTabWebUrl, type WebTabName } from '../config/webRoutes';
import { useNativeAuthSession } from '../navigation/NativeAuthSessionContext';
import { colors, spacing } from '../theme';

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

export function TabWebViewScreen({ tabName }: { tabName: WebTabName }) {
  const { clearNativeSession, completeWebLogout, isWebLogoutPending, logoutVersion } = useNativeAuthSession();
  const webViewRef = useRef<WebView>(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const [webLogoutVersion, setWebLogoutVersion] = useState(0);
  const [hasError, setHasError] = useState(false);
  const url = getTabWebUrl(tabName);
  const source = useMemo(() => ({ uri: url }), [url]);
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

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data) as { type?: string };

        if (payload.type === 'baptist-one:logout') {
          clearNativeSession();
        }
      } catch {
        // Ignore messages that do not belong to the native shell bridge.
      }
    },
    [clearNativeSession],
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
