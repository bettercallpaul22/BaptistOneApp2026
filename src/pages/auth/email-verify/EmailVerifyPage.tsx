import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppLoader, NoAccessModal } from '@/components/feedback';
import { usePostLoginAccess } from '@/hooks/usePostLoginAccess';
import { AuthLayout } from '@/layouts/AuthLayout';
import { paths } from '@/routes/paths';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { pushNotification } from '@/store/slices/notificationSlice';
import { handoffLoginThunk, switchAccessThunk } from '@/store/thunks/authThunk';
import { authCardClass, authErrorClass } from '../authClasses';

type VerificationStatus = 'loading' | 'error';

export default function EmailVerifyPage() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const hasRequestedRef = useRef(false);
  const code = useMemo(() => new URLSearchParams(location.search).get('code')?.trim() ?? '', [location.search]);
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const { authData } = useAppSelector((state) => state.auth);
  const { ready, showNoAccessModal, findBestAccess, handleLogoutAndRedirect } = usePostLoginAccess(authData);

  const completeHandoffLogin = useCallback(async () => {
    if (!code) {
      setStatus('error');
      setMessage('This handoff link is missing a code. Please request a new link or sign in again.');
      return;
    }

    setStatus('loading');
    setMessage(null);

    try {
      const authResult = await dispatch(handoffLoginThunk({ code })).unwrap();

      if (authResult.currentAccess.resourceType !== 'church-member') {
        const targetAccess = findBestAccess(authResult.userAccess);
        if (targetAccess && targetAccess.resourceType === 'church-member') {
          await dispatch(switchAccessThunk({ accessId: targetAccess.id })).unwrap();
        }
      }

      dispatch(pushNotification({ type: 'success', title: 'Signed in', message: 'Welcome to BaptistOne.' }));
    } catch (error) {
      const errorMessage = (error as { message?: string })?.message ?? 'We could not complete this handoff login. Please try again.';
      setStatus('error');
      setMessage(errorMessage);
      dispatch(pushNotification({ type: 'error', title: 'Handoff login failed', message: errorMessage }));
    }
  }, [code, dispatch, findBestAccess]);

  useEffect(() => {
    if (hasRequestedRef.current) return;

    hasRequestedRef.current = true;
    void completeHandoffLogin();
  }, [completeHandoffLogin]);

  useEffect(() => {
    if (!ready || status === 'error') return;
    navigate(paths.home, { replace: true });
  }, [ready, status, navigate]);

  return (
    <AuthLayout title="Signing You In" subtitle="We are confirming your BaptistOne handoff">
      <NoAccessModal open={showNoAccessModal} onLogout={handleLogoutAndRedirect} />
      <div className={authCardClass}>
        {status === 'loading' ? (
          <div className="grid justify-items-center gap-4 py-3 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-blue-50 text-[#123B8D]">
              <CheckCircle2 className="size-9" aria-hidden />
            </span>
            <div className="grid gap-2">
              <AppText variant="h5">Signing in</AppText>
              <AppText variant="bodyMedium" color="textSecondary">
                Please wait while we complete your handoff login.
              </AppText>
            </div>
            <AppLoader label="Checking handoff link" />
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid justify-items-center gap-4 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-red-50 text-red-600">
                <AlertCircle className="size-9" aria-hidden />
              </span>
              <div className="grid gap-2">
                <AppText variant="h5">Handoff login failed</AppText>
                {message && <div className={authErrorClass}>{message}</div>}
              </div>
            </div>
            <div className="grid gap-3">
              <AppButton fullWidth leftIcon={<RotateCcw className="size-4" aria-hidden />} onClick={completeHandoffLogin}>
                Retry
              </AppButton>
              <AppButton fullWidth variant="outline" onClick={() => navigate(paths.login)}>
                Back to Login
              </AppButton>
              <AppButton fullWidth variant="ghost" onClick={() => navigate(paths.forgotPassword)}>
                Request Password Reset
              </AppButton>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
