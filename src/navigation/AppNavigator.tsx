import { TabWebViewScreen } from '../screens/TabWebViewScreen';
import { NativeAuthSessionProvider } from './NativeAuthSessionContext';

export function AppNavigator() {
  return (
    <NativeAuthSessionProvider>
      <TabWebViewScreen tabName="Home" />
    </NativeAuthSessionProvider>
  );
}
