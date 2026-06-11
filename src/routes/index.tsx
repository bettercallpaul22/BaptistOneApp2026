import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { MobileBottomTab } from '@/components/navigation';
import { AppLoader } from '@/components/feedback';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';
import { useIsNativeShell } from '@/hooks/useIsNativeShell';
import { tokenStore } from '@/services/api';
import { applyAuthCheck } from '@/store/slices/authSlice';
import { pushNotification } from '@/store/slices/notificationSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getStoredAuthStatus } from '@/utils/authToken';
import { RouteLoader } from './RouteLoader';
import { HomeRoute } from './HomeRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { paths } from './paths';

const HomePage = lazy(() => import('@/pages/home/HomePage'));
const BiblePage = lazy(() => import('@/pages/bible/BiblePage'));
const HymnalPage = lazy(() => import('@/pages/hymnal/HymnalPage'));
const AppTabPage = lazy(() => import('@/pages/app/AppTabPage'));
const AppPlaceholderPage = lazy(() => import('@/pages/app/AppPlaceholderPage'));
const LaunchPage = lazy(() => import('@/pages/launch/LaunchPage'));
const LoginPage = lazy(() => import('@/pages/auth/login/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/register/RegisterPage'));
const RegisterVerificationPage = lazy(() => import('@/pages/auth/register/RegisterVerificationPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/forgot-password/ForgotPasswordPage'));
const VerifyOtpPage = lazy(() => import('@/pages/auth/verify-otp/VerifyOtpPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/reset-password/ResetPasswordPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const AuthSessionGate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const authStatus = getStoredAuthStatus();

    if (authStatus.status === 'authenticated') {
      tokenStore.setAccessToken(authStatus.accessToken);
    } else if (authStatus.status === 'expired' || authStatus.status === 'invalid') {
      tokenStore.clear();
    }

    dispatch(applyAuthCheck(authStatus));

    if (authStatus.status === 'expired') {
      dispatch(
        pushNotification({
          type: 'warning',
          title: 'Session expired',
          message: 'Please sign in again to continue.',
        }),
      );

      if (!pathname.startsWith('/auth')) {
        navigate(paths.login, { replace: true });
      }
    }
  }, [dispatch, navigate, pathname]);

  return null;
};

const LaunchRoute = () => {
  const { hasKnownUser, isAuthChecked, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthChecked) {
    return <AppLoader variant="page" label="Checking session" />;
  }

  return isAuthenticated || hasKnownUser ? <Navigate replace to={paths.home} /> : <LaunchPage />;
};

const RoutedApp = () => {
  const { pathname } = useLocation();
  const { isDesktop } = useDeviceProfile();
  useIsNativeShell();
  const [isBibleBottomTabHidden, setIsBibleBottomTabHidden] = useState(false);
  const showWebBottomTab = !isDesktop && pathname !== paths.launch && !pathname.startsWith('/auth');
  const hideWebBottomTab = pathname === paths.bible && isBibleBottomTabHidden;

  return (
    <>
      <AuthSessionGate />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path={paths.launch} element={<LaunchRoute />} />
          <Route path={paths.bible} element={<BiblePage onBottomTabHiddenChange={setIsBibleBottomTabHidden} />} />
          <Route path={paths.hymnal} element={<HymnalPage />} />
          <Route element={<HomeRoute />}>
            <Route path={paths.home} element={<HomePage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path={paths.news} element={<AppPlaceholderPage title="News" />} />
            <Route path={paths.forum} element={<AppPlaceholderPage title="Forum" />} />
            <Route path={paths.ministries} element={<AppPlaceholderPage title="Ministries" />} />
            <Route path={paths.donation} element={<AppPlaceholderPage title="Donation" />} />
            <Route path={paths.media} element={<AppPlaceholderPage title="Media" />} />
            <Route path={paths.church} element={<AppTabPage kind="church" />} />
            <Route path={paths.resources} element={<AppPlaceholderPage title="Resources" />} />
            <Route path={paths.discipleship} element={<AppPlaceholderPage title="Discipleship" />} />
            <Route path={paths.wallet} element={<AppTabPage kind="wallet" />} />
            <Route path={paths.profile} element={<AppTabPage kind="profile" />} />
            <Route path={paths.settings} element={<AppPlaceholderPage title="Settings" />} />
            <Route path={paths.devotional} element={<AppPlaceholderPage title="Devotional" />} />
            <Route path={paths.sundaySchool} element={<AppPlaceholderPage title="Sunday School" />} />
          </Route>
          <Route element={<PublicRoute />}>
            <Route path={paths.login} element={<LoginPage />} />
            <Route path={paths.register} element={<RegisterPage />} />
            <Route path={paths.registerVerification} element={<RegisterVerificationPage />} />
            <Route path={paths.forgotPassword} element={<ForgotPasswordPage />} />
            <Route path={paths.verifyOtp} element={<VerifyOtpPage />} />
            <Route path={paths.resetPassword} element={<ResetPasswordPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      {showWebBottomTab && <MobileBottomTab hidden={hideWebBottomTab} />}
    </>
  );
};

export const AppRouter = () => (
  <BrowserRouter>
    <RoutedApp />
  </BrowserRouter>
);
