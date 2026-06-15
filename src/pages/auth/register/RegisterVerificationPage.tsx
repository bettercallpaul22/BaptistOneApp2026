import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, MailCheck, RotateCcw } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppLoader } from '@/components/feedback';
import { AuthLayout } from '@/layouts/AuthLayout';
import { paths } from '@/routes/paths';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { pushNotification } from '@/store/slices/notificationSlice';
import { intentLogin } from '@/store/thunks/authThunk';
import { authCardClass, authErrorClass, authFooterClass, authLinkClass } from '../authClasses';

type VerificationStatus = 'loading' | 'error';

export default function RegisterVerificationPage() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const hasRequestedRef = useRef(false);
  const registration = useAppSelector((state) => state.auth.registration);
  const email = (location.state as { email?: string } | null)?.email ?? registration?.email ?? 'your email address';
  const intent = useMemo(() => new URLSearchParams(location.search).get('intent')?.trim() ?? '', [location.search]);
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState<string | null>(null);

  const completeEmailVerification = useCallback(async () => {
    if (!intent) {
      setStatus('error');
      setMessage('This verification link is missing an intent. Please request a new verification link or sign in again.');
      return;
    }

    setStatus('loading');
    setMessage(null);

    try {
      await dispatch(intentLogin({ intent })).unwrap();
      dispatch(pushNotification({ type: 'success', title: 'Email verified', message: 'Welcome to BaptistOne.' }));
      navigate(paths.home, { replace: true });
    } catch (error) {
      const errorMessage = (error as { message?: string })?.message ?? 'We could not verify your email. Please try again.';
      setStatus('error');
      setMessage(errorMessage);
      dispatch(pushNotification({ type: 'error', title: 'Email verification failed', message: errorMessage }));
    }
  }, [dispatch, intent, navigate]);

  useEffect(() => {
    if (!intent || hasRequestedRef.current) return;

    hasRequestedRef.current = true;
    void completeEmailVerification();
  }, [completeEmailVerification, intent]);

  if (intent) {
    return (
      <AuthLayout title="Verifying Email" subtitle="We are confirming your BaptistOne account">
        <div className={authCardClass}>
          {status === 'loading' ? (
            <div className="grid justify-items-center gap-4 py-3 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-blue-50 text-[#123B8D]">
                <CheckCircle2 className="size-9" aria-hidden />
              </span>
              <div className="grid gap-2">
                <AppText variant="h5">Verifying your email</AppText>
                <AppText variant="bodyMedium" color="textSecondary">
                  Please wait while we activate your account and sign you in.
                </AppText>
              </div>
              <AppLoader label="Checking verification link" />
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid justify-items-center gap-4 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-red-50 text-red-600">
                  <AlertCircle className="size-9" aria-hidden />
                </span>
                <div className="grid gap-2">
                  <AppText variant="h5">Email verification failed</AppText>
                  {message && <div className={authErrorClass}>{message}</div>}
                </div>
              </div>
              <div className="grid gap-3">
                <AppButton fullWidth leftIcon={<RotateCcw className="size-4" aria-hidden />} onClick={completeEmailVerification}>
                  Retry
                </AppButton>
                <AppButton fullWidth variant="outline" onClick={() => navigate(paths.login)}>
                  Back to Login
                </AppButton>
              </div>
            </div>
          )}
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Check Your Email" subtitle="Your BaptistOne account is almost ready">
      <div className={authCardClass}>
        <div className="grid justify-items-center gap-4 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <MailCheck className="size-9" aria-hidden />
          </span>
          <div className="grid gap-2">
            <AppText variant="h5">Verification link sent</AppText>
            <AppText variant="bodyMedium" color="textSecondary">
              We sent an email verification link to {email}. Open the link from your inbox to activate your account.
            </AppText>
          </div>
        </div>
        <AppButton fullWidth onClick={() => window.open('mailto:', '_self')}>
          Open Email App
        </AppButton>
        <div className={authFooterClass}>
          <span>Already verified?</span>
          <Link className={authLinkClass} to={paths.login}>
            Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
