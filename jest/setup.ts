import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    GestureHandlerRootView: ({ children, style }: { children: React.ReactNode; style?: unknown }) =>
      React.createElement(View, { style }, children),
  };
});

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));

jest.mock('react-native-device-info', () => ({
  getApplicationName: jest.fn(() => Promise.resolve('BaptistOneApp')),
  getVersion: jest.fn(() => Promise.resolve('1.0.0')),
  getBuildNumber: jest.fn(() => Promise.resolve('1')),
  getBundleId: jest.fn(() => Promise.resolve('com.baptistapp')),
  getSystemName: jest.fn(() => Promise.resolve('iOS')),
  getSystemVersion: jest.fn(() => Promise.resolve('18.0')),
  getModel: jest.fn(() => Promise.resolve('iPhone')),
  getBrand: jest.fn(() => Promise.resolve('Apple')),
  getDeviceId: jest.fn(() => Promise.resolve('test-device-id')),
  isTablet: jest.fn(() => Promise.resolve(false)),
}));

jest.mock('react-native-config', () => ({
  API_BASE_URL: 'http://localhost:3000',
  WEBVIEW_URL: 'http://192.168.18.5:5173',
}));

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
      React.createElement(View, { ref, testID: 'native-webview', ...props }),
    ),
  };
});

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    BottomSheetBackdrop: (props: Record<string, unknown>) => React.createElement(View, props),
    BottomSheetModal: React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
      React.createElement(View, { ref, ...props }),
    ),
    BottomSheetModalProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    BottomSheetView: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});
