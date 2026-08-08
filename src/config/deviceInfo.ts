import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { env } from './env';

export interface DeviceDetails {
  appName: string;
  appVersion: string;
  buildNumber: string;
  bundleId: string;
  systemName: string;
  systemVersion: string;
  model: string;
  brand: string;
  deviceId: string;
  isTablet: boolean;
  os: string;
  osVersion: string;
}

export async function getDeviceDetails(): Promise<DeviceDetails> {
  const [
    appName,
    appVersion,
    buildNumber,
    bundleId,
    systemName,
    systemVersion,
    model,
    brand,
    deviceId,
    isTablet,
  ] = await Promise.all([
    DeviceInfo.getApplicationName(),
    DeviceInfo.getVersion(),
    DeviceInfo.getBuildNumber(),
    DeviceInfo.getBundleId(),
    DeviceInfo.getSystemName(),
    DeviceInfo.getSystemVersion(),
    DeviceInfo.getModel(),
    DeviceInfo.getBrand(),
    DeviceInfo.getDeviceId(),
    DeviceInfo.isTablet(),
  ]);

  return {
    appName,
    appVersion,
    buildNumber,
    bundleId,
    systemName,
    systemVersion,
    model,
    brand,
    deviceId,
    isTablet,
    os: Platform.OS,
    osVersion: String(Platform.Version),
  };
}

export async function logDeviceDetails(): Promise<DeviceDetails> {
  const details = await getDeviceDetails();
  console.log('[DeviceInfo] ─────────────────────────────────');
  console.log('[DeviceInfo] App:', details.appName, `v${details.appVersion} (${details.buildNumber})`);
  console.log('[DeviceInfo] Bundle:', details.bundleId);
  console.log('[DeviceInfo] OS:', details.systemName, details.systemVersion);
  console.log('[DeviceInfo] Device:', details.brand, details.model);
  console.log('[DeviceInfo] Device ID:', details.deviceId);
  console.log('[DeviceInfo] Tablet:', details.isTablet);
  console.log('[DeviceInfo] ─────────────────────────────────');
  return details;
}

interface PlatformVersionInfo {
  version?: string;
  versionName?: string;
  build?: number | string;
  versionCode?: number | string;
  storeUrl?: string;
}

export interface WebVersionInfo {
  ios: PlatformVersionInfo;
  android: PlatformVersionInfo;
}

function parseVersion(version: string): number[] {
  return version.split('.').map(Number);
}

function isNewerVersion(webVersion: string, nativeVersion: string): boolean {
  const web = parseVersion(webVersion);
  const native = parseVersion(nativeVersion);
  const maxLen = Math.max(web.length, native.length);

  for (let i = 0; i < maxLen; i++) {
    const w = web[i] ?? 0;
    const n = native[i] ?? 0;
    if (w > n) return true;
    if (w < n) return false;
  }
  return false;
}

export async function checkWebVersion(): Promise<WebVersionInfo | null> {
  try {
    const baseUrl = env.webviewUrl.replace(/\/+$/, '');
    const cacheBustUrl = `${baseUrl}/version.json?t=${Date.now()}`;
    console.log('[VersionCheck] Fetching from:', cacheBustUrl);
    const response = await fetch(cacheBustUrl, {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    const data = await response.json() as WebVersionInfo;
    const platformVersion = Platform.OS === 'ios' ? data.ios : data.android;
    const webVersion = platformVersion?.version ?? platformVersion?.versionName ?? '';
    const webBuild = String(platformVersion?.build ?? platformVersion?.versionCode ?? '');
    console.log('[VersionCheck] Web version (' + Platform.OS + '):', webVersion, `(${webBuild})`);
    return data;
  } catch (error) {
    console.warn('[VersionCheck] Failed to fetch version.json:', error);
    return null;
  }
}

export interface UpdateCheckResult {
  needed: boolean;
  nativeVersion: string;
  webVersion: string;
  storeUrl?: string;
}

export async function shouldShowUpdateModal(): Promise<UpdateCheckResult | null> {
  const [nativeDetails, webVersion] = await Promise.all([
    getDeviceDetails(),
    checkWebVersion(),
  ]);

  if (!webVersion) return null;

  const platformVersion = Platform.OS === 'ios' ? webVersion.ios : webVersion.android;
  const webVersionString = platformVersion?.version ?? platformVersion?.versionName ?? '';
  const needsUpdate = isNewerVersion(webVersionString, nativeDetails.appVersion);

  console.log('[VersionCheck] Native:', nativeDetails.appVersion, '| Web (' + Platform.OS + '):', webVersionString, '| Web needs update:', needsUpdate);

  if (needsUpdate) {
    return {
      needed: true,
      nativeVersion: nativeDetails.appVersion,
      webVersion: webVersionString,
      storeUrl: platformVersion?.storeUrl,
    };
  }
  return null;
}