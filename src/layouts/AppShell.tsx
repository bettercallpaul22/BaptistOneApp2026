import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  BookOpen,
  Church,
  CreditCard,
  Home,
  Music2,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { UserProfileImage } from '@/components/display';
import { AppModal } from '@/components/feedback';
import { AppMobileHeader, NotificationButton } from '@/components/navigation/AppMobileHeader';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';
import { MenuScreen } from '@/pages/menu/MenuScreen';
import { menuItems } from '@/pages/menu/menuItems';
import { paths } from '@/routes/paths';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { pushNotification } from '@/store/slices/notificationSlice';


interface NavigationItem {
  label: string;
  icon: LucideIcon;
  to: string;
}

const desktopNavItems: NavigationItem[] = [
  { label: 'Home', icon: Home, to: paths.home },
  { label: 'Bible', icon: BookOpen, to: paths.bible },
  { label: 'Hymnal', icon: Music2, to: paths.hymnal },
  { label: 'Church', icon: Users, to: paths.church },
  { label: 'Wallet', icon: CreditCard, to: paths.wallet },
  { label: 'Profile', icon: User, to: paths.profile },
];

interface AppShellProps {
  children: ReactNode;
  headerAvatar?: ReactNode;
  mobileHeaderAddon?: ReactNode;
}

type NativeWebViewWindow = Window & {
  ReactNativeWebView?: {
    postMessage: (message: string) => void;
  };
};

const postNativeLogout = () => {
  const nativeWebView = (window as NativeWebViewWindow).ReactNativeWebView;

  if (nativeWebView) {
    nativeWebView.postMessage(JSON.stringify({ type: 'baptist-one:logout' }));
  }
};

const DesktopHeader = ({ title }: { title: string }) => (
  <header className="fixed top-0 right-0 left-[18rem] z-20 flex min-h-20 items-center justify-between border-b border-[#E5E7EB] bg-white/95 px-8 backdrop-blur-xl">
    <div className="grid gap-1">
      <AppText variant="h5">{title}</AppText>
      <AppText variant="bodySmall" color="textMuted">
        First Baptist Church Lagos
      </AppText>
    </div>
    <NotificationButton />
  </header>
);

export const AppShell = ({ children, headerAvatar, mobileHeaderAddon }: AppShellProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isDesktop } = useDeviceProfile();
  const mobileHeaderRef = useRef<HTMLDivElement>(null);
  const { hasKnownUser, isAuthenticated } = useAppSelector((state) => state.auth);

  const showSidebar = isDesktop;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuLoginPromptOpen, setIsMenuLoginPromptOpen] = useState(false);
  const [pendingMenuPath, setPendingMenuPath] = useState<string | null>(null);
  const [dismissedRestrictedPath, setDismissedRestrictedPath] = useState<string | null>(null);
  const [mobileHeaderHeight, setMobileHeaderHeight] = useState(64);
  const headerTitle = useMemo(() => {
    if (pathname.startsWith(paths.family)) return 'Family';

    const activeItem = [...desktopNavItems, ...menuItems].find((item) => pathname === item.to);
    return activeItem?.label ?? 'Home';
  }, [pathname]);
  const isRestrictedKnownUserPath = useMemo(() => {
    if (isAuthenticated || !hasKnownUser) return false;

    const unrestrictedPaths = new Set<string>([paths.home, paths.bible, paths.hymnal]);

    return (
      !pathname.startsWith('/auth') && pathname !== paths.launch && !unrestrictedPaths.has(pathname)
    );
  }, [hasKnownUser, isAuthenticated, pathname]);
  const isRestrictedLoginPromptOpen =
    isRestrictedKnownUserPath && dismissedRestrictedPath !== pathname;
  const isLoginPromptOpen = isMenuLoginPromptOpen || isRestrictedLoginPromptOpen;
  const isPendingMenuRouteReady = Boolean(pendingMenuPath && pathname === pendingMenuPath);
  const showMobileMenu = isMenuOpen && !isPendingMenuRouteReady;
  // const defaultHeaderAvatar = isAuthenticated ?
  //  <UserProfileImage size="md" /> : null;
  const defaultHeaderAvatar = useMemo(
  () => (isAuthenticated ? <UserProfileImage size="md" /> : null),
  [isAuthenticated], // only recreates when auth state actually changes
);
  const mobileHeaderAvatar = headerAvatar ?? defaultHeaderAvatar;

  const handleLogout = () => {
    dispatch(logout());
    postNativeLogout();
    setIsMenuOpen(false);
    setPendingMenuPath(null);
    dispatch(
      pushNotification({ type: 'info', title: 'Logged out', message: 'You have been signed out.' }),
    );
    navigate(paths.home, { replace: true });
  };

  const handleMobileMenuPress = () => {
    if (!isAuthenticated) {
      setIsMenuLoginPromptOpen(true);
      return;
    }

    setPendingMenuPath(null);
    setIsMenuOpen(true);
  };

  const handleHeaderAvatarPress = () => {
    navigate(paths.profile, { state: { profileTab: 'profile' } });
  };

  const closeMenu = () => {
    setPendingMenuPath(null);
    setIsMenuOpen(false);
  };

  const handleMenuNavigate = (to?: string) => {
    if (!to) return;

    if (pathname === to) {
      closeMenu();
      return;
    }

    setPendingMenuPath(to);
    navigate(to);
  };

  const closeLoginPrompt = () => {
    setIsMenuLoginPromptOpen(false);

    if (isRestrictedLoginPromptOpen) {
      setDismissedRestrictedPath(pathname);
    }
  };

  const handleLoginPromptConfirm = () => {
    setIsMenuLoginPromptOpen(false);
    setDismissedRestrictedPath(pathname);
    navigate(paths.login);
  };

  useEffect(() => {
    if (showSidebar) return;

    const headerElement = mobileHeaderRef.current;
    if (!headerElement) return;

    const updateHeaderHeight = () => {
      setMobileHeaderHeight(headerElement.getBoundingClientRect().height);
    };

    updateHeaderHeight();

    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    resizeObserver.observe(headerElement);

    return () => resizeObserver.disconnect();
  }, [mobileHeaderAddon, showSidebar]);

  return (
    <div className={clsx('min-h-screen bg-white text-[#0B1F4A]', !showSidebar && 'pb-24')}>
      {showSidebar && (
        <aside className="fixed inset-y-0 left-0 z-30 flex w-[18rem] flex-col border-r border-[#E5E7EB] bg-white">
          <Link
            className="flex items-center gap-3 px-8 py-8 text-2xl font-extrabold text-[#123B8D]"
            to={paths.home}
          >
            <Church className="size-8 fill-[#123B8D]/10" aria-hidden />
            <span>Faith BC Lugbe</span>
          </Link>
          <nav className="grid gap-2 px-5" aria-label="Primary navigation">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to;

              return (
                <Link
                  className={`flex min-h-14 items-center gap-4 rounded-lg px-4 text-lg font-semibold ${
                    active
                      ? 'bg-[#E8EEF9] text-[#123B8D]'
                      : 'text-[#46556E] hover:bg-slate-50 hover:text-[#123B8D]'
                  }`}
                  key={item.label}
                  to={item.to}
                >
                  <Icon className="size-6" aria-hidden />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-[#E5E7EB] px-8 py-6">
            <AppText variant="subtitle">Samson A.</AppText>
            <AppText variant="bodySmall" color="textMuted">
              Faith BC Lugbe
            </AppText>
          </div>
        </aside>
      )}

      {showSidebar ? (
        <DesktopHeader title={headerTitle} />
      ) : (
        <div ref={mobileHeaderRef} className="fixed inset-x-0 top-0 z-40">
          <AppMobileHeader
            avatar={
              mobileHeaderAvatar ? (
                <button
                  type="button"
                  className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-[#123B8D]/20"
                  aria-label="Open profile"
                  onClick={handleHeaderAvatarPress}
                >
                  {mobileHeaderAvatar}
                </button>
              ) : null
            }
            title={headerTitle}
            position="static"
            onActionPress={handleMobileMenuPress}
          />
          {mobileHeaderAddon}
        </div>
      )}
      {!showSidebar && (
        <MenuScreen
          isOpen={showMobileMenu}
          pendingPath={pendingMenuPath}
          onClose={closeMenu}
          onLogout={handleLogout}
          onNavigate={handleMenuNavigate}
        />
      )}
      <AppModal
        open={isLoginPromptOpen}
        title="Login required"
        onClose={closeLoginPrompt}
        footerLayout="split"
        footer={
          <>
            <AppButton variant="secondary" onClick={closeLoginPrompt}>
              Cancel
            </AppButton>
            <AppButton onClick={handleLoginPromptConfirm}>Login</AppButton>
          </>
        }
      >
        {isRestrictedLoginPromptOpen
          ? 'Please login to continue.'
          : 'Please login to view the menu.'}
      </AppModal>

      <main
        className={clsx(showSidebar && 'ml-[18rem] pt-20')}
        style={!showSidebar ? { paddingTop: mobileHeaderHeight } : undefined}
      >
        {children}
      </main>
    </div>
  );
};
