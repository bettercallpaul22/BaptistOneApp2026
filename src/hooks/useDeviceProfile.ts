import { useEffect, useMemo, useState } from 'react';

export type DeviceClass = 'small' | 'medium' | 'foldable' | 'tablet' | 'ipad' | 'desktop';

export interface DeviceProfile {
  width: number;
  height: number;
  deviceClass: DeviceClass;
  isSmallDevice: boolean;
  isMediumDevice: boolean;
  isFoldableDevice: boolean;
  isTablet: boolean;
  isIPad: boolean;
  isDesktop: boolean;
}

const getViewport = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

const getDeviceClass = (width: number): DeviceClass => {
  if (width > 1180) return 'desktop';
  if (width >= 1024) return 'ipad';
  if (width >= 768) return 'tablet';
  if (width >= 640) return 'foldable';
  if (width >= 390) return 'medium';
  return 'small';
};

export const useDeviceProfile = (): DeviceProfile => {
  const [viewport, setViewport] = useState(getViewport);

  useEffect(() => {
    const updateViewport = () => setViewport(getViewport());

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  return useMemo(() => {
    const deviceClass = getDeviceClass(viewport.width);

    return {
      ...viewport,
      deviceClass,
      isSmallDevice: deviceClass === 'small',
      isMediumDevice: deviceClass === 'medium',
      isFoldableDevice: deviceClass === 'foldable',
      isTablet: deviceClass === 'tablet',
      isIPad: deviceClass === 'ipad',
      isDesktop: deviceClass === 'desktop',
    };
  }, [viewport]);
};
