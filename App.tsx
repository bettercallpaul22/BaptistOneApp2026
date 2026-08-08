import { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, StatusBar, StyleSheet, ToastAndroid, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { DeepLinkProvider } from './src/navigation/DeepLinkContext';
import { UpdateModal } from './src/features/update/UpdateModal';
import { logDeviceDetails, shouldShowUpdateModal } from './src/config/deviceInfo';
import { colors } from './src/theme/colors';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const lastBackPress = useRef(0);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [nativeVersion, setNativeVersion] = useState('');
  const [webVersion, setWebVersion] = useState('');
  const [storeUrl, setStoreUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    console.log(`[App] Running on ${Platform.OS} ${Platform.Version}`);
    logDeviceDetails().catch((error) => {
      console.warn('[App] Failed to log device details:', error);
    });

    shouldShowUpdateModal()
      .then((result) => {
        if (result?.needed) {
          setNativeVersion(result.nativeVersion);
          setWebVersion(result.webVersion);
          setStoreUrl(result.storeUrl);
          setShowUpdateModal(true);
        }
      })
      .catch((error) => {
        console.warn('[App] Version check failed:', error);
      });
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

          <UpdateModal
            visible={showUpdateModal}
            nativeVersion={nativeVersion}
            webVersion={webVersion}
            storeUrl={storeUrl}
            onDismiss={() => setShowUpdateModal(false)}
          />
        </DeepLinkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;