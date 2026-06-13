import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AppButton } from '@/components/common';
import { AppInput } from '@/components/form';
import { storageKeys } from '@/constants/storage';
import { AuthLayout } from '@/layouts/AuthLayout';
import { paths } from '@/routes/paths';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError } from '@/store/slices/authSlice';
import { pushNotification } from '@/store/slices/notificationSlice';
import { forgotPasswordThunk } from '@/store/thunks/authThunk';
import { authCardClass, authErrorClass, authFormClass, authLinkClass } from '../authClasses';

const schema = z.object({ email: z.string().email('Enter a valid email address') });
type FormValues = z.infer<typeof schema>;
const otpCountdownDurationMs = 3 * 60 * 1000;

const setPasswordResetCountdown = () => {
  localStorage.setItem(storageKeys.passwordResetOtpExpiresAt, String(Date.now() + otpCountdownDurationMs));
};

export default function ForgotPasswordPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { error, forgotPasswordLoading } = useAppSelector((state) => state.auth);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }: FormValues) => {
    dispatch(clearAuthError());

    try {
      const result = await dispatch(forgotPasswordThunk({ email })).unwrap();
      localStorage.setItem(storageKeys.passwordResetEmail, email);
      setPasswordResetCountdown();

      dispatch(
        pushNotification({
          type: 'success',
          title: 'Check your email',
          message: result.message,
        }),
      );
      navigate(paths.resetPassword, { state: { email }, replace: true });
    } catch {
      // The auth slice exposes the form error.
    }
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="We will send a verification code to your account">
      <div className={authCardClass}>
        {error && <div className={authErrorClass}>{error}</div>}
        <form className={authFormClass} onSubmit={handleSubmit(onSubmit)}>
          <AppInput
            label="Email"
            placeholder="Enter your email"
            error={formState.errors.email?.message}
            inputMode="email"
            autoComplete="email"
            {...register('email')}
          />
          <AppButton fullWidth loading={forgotPasswordLoading} type="submit">
            Send Code
          </AppButton>
        </form>
        <Link className={authLinkClass} to={paths.login}>
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
