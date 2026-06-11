import { MailCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AuthLayout } from '@/layouts/AuthLayout';
import { paths } from '@/routes/paths';
import { useAppSelector } from '@/store/hooks';
import { authCardClass, authFooterClass, authLinkClass } from '../authClasses';

export default function RegisterVerificationPage() {
  const location = useLocation();
  const registration = useAppSelector((state) => state.auth.registration);
  const email = (location.state as { email?: string } | null)?.email ?? registration?.email ?? 'your email address';

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
