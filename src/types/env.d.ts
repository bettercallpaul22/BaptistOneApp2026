declare module 'react-native-config' {
  interface NativeConfig {
    API_BASE_URL?: string;
    WEBVIEW_URL?: string;
  }

  const Config: NativeConfig;
  export default Config;
}
