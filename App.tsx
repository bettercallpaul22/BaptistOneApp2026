import { useEffect, useRef, useState } from 'react';
import { BackHandler, Linking, Modal, Platform, Pressable, StatusBar, StyleSheet, Text, ToastAndroid, useColorScheme, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { DeepLinkProvider } from './src/navigation/DeepLinkContext';
import { env } from './src/config/env';
import { colors } from './src/theme/colors';

const STORE_URL = Platform.OS === 'ios'
  ? 'https://apps.apple.com/us/app/baptistone-app/id6757314556'
  : 'https://play.google.com/store/apps/details?id=com.baptistapp';

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const lastBackPress = useRef(0);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');

  useEffect(() => {
    const nativeVersion = DeviceInfo.getVersion();
    const nativeBuild = DeviceInfo.getBuildNumber();
    console.log(`[App] Native — Version: ${nativeVersion}, Build: ${nativeBuild}, Platform: ${Platform.OS}`);

    fetch(`${env.webviewUrl}version.json`)
      .then((res) => res.json())
      .then((data) => {
        console.log('[App] Web version.json:', data);

        const web = Platform.OS === 'ios' ? data.ios : data.android;
        const webVersion = Platform.OS === 'ios' ? web.version : web.versionName;
        const webBuild = String(Platform.OS === 'ios' ? web.build : web.versionCode);

        const versionMatch = nativeVersion === webVersion;
        const buildMatch = nativeBuild === webBuild;

        console.log(`[App] Version match: ${versionMatch} (native: ${nativeVersion}, web: ${webVersion})`);
        console.log(`[App] Build match: ${buildMatch} (native: ${nativeBuild}, web: ${webBuild})`);

        if (!versionMatch || !buildMatch) {
          const webIsNewer = compareVersions(webVersion, nativeVersion) > 0 || Number(webBuild) > Number(nativeBuild);
          if (webIsNewer) {
            setLatestVersion(webVersion);
            setShowUpdateModal(true);
          }
        }
      })
      .catch((err) => console.warn('[App] Failed to fetch version.json:', err));
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      const now = Date.now();
      if (now - lastBackPress.current < 2000) {
        return false;
      }
      lastBackPress.current = now;
      ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
      return true;
    });

    return () => backHandler.remove();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <DeepLinkProvider>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={colors.surface}
          />
          <AppNavigator />

          <Modal visible={showUpdateModal} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalIcon}>
                  <Text style={styles.modalIconText}>⬆</Text>
                </View>
                <Text style={styles.modalTitle}>Update Available</Text>
                <Text style={styles.modalMessage}>
                  A new version (v{latestVersion}) of BaptistOne is available. Please update to the latest version for the best experience.
                </Text>
                <Pressable
                  style={styles.modalButton}
                  onPress={() => {
                    Linking.openURL(STORE_URL);
                    setShowUpdateModal(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Update Now</Text>
                </Pressable>
                <Pressable
                  style={styles.modalSkipButton}
                  onPress={() => setShowUpdateModal(false)}
                >
                  <Text style={styles.modalSkipText}>Maybe Later</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </DeepLinkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 16,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIconText: {
    fontSize: 28,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
  modalSkipButton: {
    paddingVertical: 8,
  },
  modalSkipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
});

export default App;
