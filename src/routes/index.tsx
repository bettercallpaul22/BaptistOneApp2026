import { lazy, Suspense, useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppText } from '@/components/common';
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
const EventsPage = lazy(() => import('@/pages/events/EventsPage'));
const AppTabPage = lazy(() => import('@/pages/app/AppTabPage'));
const AppPlaceholderPage = lazy(() => import('@/pages/app/AppPlaceholderPage'));
const ChurchBrowsePage = lazy(() => import('@/pages/church/ChurchBrowsePage'));
const ChurchDocumentsPage = lazy(() => import('@/pages/church/ChurchDocumentsPage'));
const ChurchEventsPage = lazy(() => import('@/pages/church/ChurchEventsPage'));
const ChurchLeadershipPage = lazy(() => import('@/pages/church/ChurchLeadershipPage'));
const ChurchRegistrationReviewPage = lazy(
  () => import('@/pages/church/ChurchRegistrationReviewPage'),
);
const FamilyPage = lazy(() => import('@/pages/family/FamilyPage'));
const FamilyInvitePage = lazy(() => import('@/pages/family/FamilyInvitePage'));
const FamilyMembersPage = lazy(() => import('@/pages/family/FamilyMembersPage'));
const FamilyRequestsPage = lazy(() => import('@/pages/family/FamilyRequestsPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const WalletPage = lazy(() => import('@/pages/wallet/WalletPage'));
const WalletTransactionsPage = lazy(
  () => import('@/pages/wallet/transactions/WalletTransactionsPage'),
);
const WalletTransactionDetailsPage = lazy(
  () => import('@/pages/wallet/transactions/WalletTransactionDetailsPage'),
);
const WalletFundingCallbackPage = lazy(
  () => import('@/pages/wallet/funding-callback/WalletFundingCallbackPage'),
);
const GivingPage = lazy(() => import('@/pages/giving/GivingPage'));
const GivingCallbackPage = lazy(() => import('@/pages/giving/GivingCallbackPage'));
const ForumPage = lazy(() => import('@/pages/forum/ForumPage'));
const ForumDetailPage = lazy(() => import('@/pages/forum/ForumDetailPage'));
const LoginPage = lazy(() => import('@/pages/auth/login/LoginPage'));
const GoogleRedirectPage = lazy(() => import('@/pages/auth/google-redirect/GoogleRedirectPage'));
const EmailVerifyPage = lazy(() => import('@/pages/auth/email-verify/EmailVerifyPage'));
const RegisterPage = lazy(() => import('@/pages/auth/register/RegisterPage'));
const RegisterVerificationPage = lazy(
  () => import('@/pages/auth/register/RegisterVerificationPage'),
);
const ForgotPasswordPage = lazy(() => import('@/pages/auth/forgot-password/ForgotPasswordPage'));
const VerifyOtpPage = lazy(() => import('@/pages/auth/verify-otp/VerifyOtpPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/reset-password/ResetPasswordPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const MobileOnlyScreen = () => (
  <main className="grid min-h-screen place-items-center bg-[#F8FAFC] px-6 text-[#0B1F4A]">
    <section className="grid w-full max-w-md justify-items-center gap-4 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-[#EAF1FF] text-[#123B8D]">
        <Smartphone className="size-8" aria-hidden />
      </span>
      <div className="grid gap-2">
        <AppText variant="h3" align="center">
          Only available on mobile devices
        </AppText>
        <AppText variant="bodyMedium" color="textSecondary" align="center">
          Please open BaptistOne on a phone, tablet, or iPad-sized screen to continue.
        </AppText>
      </div>
    </section>
  </main>
);

const isChurchRegistrationReviewPath = (pathname: string) =>
  pathname === paths.churchRegistrationReview ||
  pathname.startsWith(`${paths.churchRegistrationReview}/`);

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

      if (!pathname.startsWith('/auth') && !isChurchRegistrationReviewPath(pathname)) {
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

  return isAuthenticated || hasKnownUser ? (
    <Navigate replace to={paths.home} />
  ) : (
    <Navigate replace to={paths.register} />
  );
};

const RoutedApp = () => {
  const { pathname } = useLocation();
  const { isDesktop } = useDeviceProfile();
  useIsNativeShell();
  const [isBibleBottomTabHidden, setIsBibleBottomTabHidden] = useState(false);
  const isRegistrationReviewRoute = isChurchRegistrationReviewPath(pathname);

  if (isDesktop && !isRegistrationReviewRoute) {
    return <MobileOnlyScreen />;
  }

  const showWebBottomTab =
    !isDesktop &&
    !isRegistrationReviewRoute &&
    pathname !== paths.launch &&
    pathname !== paths.familyInvite &&
    pathname !== paths.walletFundingCallback &&
    pathname !== paths.givingCallback &&
    !pathname.startsWith('/auth');
  const hideWebBottomTab = pathname === paths.bible && isBibleBottomTabHidden;

  return (
    <>
      <AuthSessionGate />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path={paths.launch} element={<LaunchRoute />} />
          <Route path={paths.googleRedirect} element={<GoogleRedirectPage />} />
          <Route path={paths.walletFundingCallback} element={<WalletFundingCallbackPage />} />
          <Route path={paths.givingCallback} element={<GivingCallbackPage />} />
          <Route path={paths.familyInvite} element={<FamilyInvitePage />} />
          <Route path={paths.churchRegistrationReview} element={<ChurchRegistrationReviewPage />} />
          <Route
            path={paths.churchRegistrationReviewTokenRoute}
            element={<ChurchRegistrationReviewPage />}
          />
          <Route
            path={paths.bible}
            element={<BiblePage onBottomTabHiddenChange={setIsBibleBottomTabHidden} />}
          />
          <Route path={paths.hymnal} element={<HymnalPage />} />
          <Route element={<HomeRoute />}>
            <Route path={paths.home} element={<HomePage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path={paths.news} element={<AppPlaceholderPage title="News" />} />
            <Route path={paths.forum} element={<ForumPage />} />
            <Route path={paths.forumDetailsRoute} element={<ForumDetailPage />} />
            <Route path={paths.ministries} element={<AppPlaceholderPage title="Ministries" />} />
            <Route path={paths.events} element={<EventsPage />} />
            <Route path={paths.donation} element={<GivingPage />} />
            <Route path={paths.media} element={<AppPlaceholderPage title="Media" />} />
            <Route path={paths.church} element={<AppTabPage kind="church" />} />
            <Route path={paths.churchBrowse} element={<ChurchBrowsePage />} />
            <Route path={paths.churchDocuments} element={<ChurchDocumentsPage />} />
            <Route path={paths.churchEvents} element={<ChurchEventsPage />} />
            <Route path={paths.churchLeadershipRoute} element={<ChurchLeadershipPage />} />
            <Route path={paths.family} element={<FamilyPage />} />
            <Route path={paths.familyMembers} element={<FamilyMembersPage />} />
            <Route path={paths.familyRequests} element={<FamilyRequestsPage />} />
            <Route path={paths.resources} element={<AppPlaceholderPage title="Resources" />} />
            <Route
              path={paths.discipleship}
              element={<AppPlaceholderPage title="Discipleship" />}
            />
            <Route path={paths.wallet} element={<WalletPage />} />
            <Route path={paths.walletTransactionsRoute} element={<WalletTransactionsPage />} />
            <Route
              path={paths.walletTransactionDetailsRoute}
              element={<WalletTransactionDetailsPage />}
            />
            <Route path={paths.profile} element={<ProfilePage />} />
            <Route path={paths.settings} element={<AppPlaceholderPage title="Settings" />} />
            <Route path={paths.devotional} element={<AppPlaceholderPage title="Devotional" />} />
            <Route
              path={paths.sundaySchool}
              element={<AppPlaceholderPage title="Sunday School" />}
            />
          </Route>
          <Route element={<PublicRoute />}>
            <Route path={paths.login} element={<LoginPage />} />
            <Route path={paths.emailVerify} element={<EmailVerifyPage />} />
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
