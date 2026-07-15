import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Linking, type AppStateStatus } from 'react-native';
import { AppState } from 'react-native';

interface DeepLinkContextValue {
  pendingGoogleIntent: string | null;
  consumeGoogleIntent: () => void;
}

const DeepLinkContext = createContext<DeepLinkContextValue | null>(null);

const GOOGLE_CALLBACK_PREFIX = 'baptistone://auth/google/callback';

const extractIntent = (url: string): string | null => {
  console.log(`[DeepLink] Checking URL: ${url}`);
  if (!url.startsWith(GOOGLE_CALLBACK_PREFIX)) return null;

  const queryString = url.includes('?') ? url.split('?')[1] : '';
  const params = new URLSearchParams(queryString);
  const intent = params.get('intent');
  console.log(`[DeepLink] Extracted intent: ${intent ? intent.substring(0, 30) + '...' : 'null'}`);
  return intent;
};

export const DeepLinkProvider = ({ children }: { children: ReactNode }) => {
  const [pendingIntent, setPendingIntent] = useState<string | null>(null);

  const consumeGoogleIntent = useCallback(() => {
    setPendingIntent(null);
  }, []);

  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      console.log(`[DeepLink] URL event received: ${url}`);
      const intent = extractIntent(url);
      if (intent) {
        console.log(`[DeepLink] Setting pending Google intent`);
        setPendingIntent(intent);
      }
    };

    Linking.getInitialURL().then((url) => {
      console.log(`[DeepLink] Initial URL: ${url ?? 'null'}`);
      if (url) handleUrl({ url });
    });

    const subscription = Linking.addEventListener('url', handleUrl);

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        Linking.getInitialURL().then((url) => {
          if (url) handleUrl({ url });
        });
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppState);

    return () => {
      subscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  const value = useMemo(
    () => ({ pendingGoogleIntent: pendingIntent, consumeGoogleIntent }),
    [pendingIntent, consumeGoogleIntent],
  );

  return <DeepLinkContext.Provider value={value}>{children}</DeepLinkContext.Provider>;
};

export const useDeepLink = () => {
  const context = useContext(DeepLinkContext);

  if (!context) {
    throw new Error('useDeepLink must be used inside DeepLinkProvider');
  }

  return context;
};
