import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import clsx from 'clsx';
import { AppButton } from '@/components/common';
import { AppInput } from '@/components/form';
import { storageKeys } from '@/constants/storage';
import { AuthLayout } from '@/layouts/AuthLayout';
import { paths } from '@/routes/paths';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError } from '@/store/slices/authSlice';
import { pushNotification } from '@/store/slices/notificationSlice';
import { forgotPasswordThunk, setPasswordThunk } from '@/store/thunks/authThunk';
import { authCardClass, authErrorClass, authFormClass, authLinkClass } from '../authClasses';

const schema = z
  .object({
    token: z.string().length(4, 'Enter the 4-digit code').regex(/^\d+$/, 'Code must contain only numbers'),
    password: z.string().min(6, 'At least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type FormValues = z.infer<typeof schema>;
const otpCountdownDurationMs = 3 * 60 * 1000;

const getStoredResetEmail = () => localStorage.getItem(storageKeys.passwordResetEmail) ?? '';

const getOtpRemainingSeconds = () => {
  const expiresAt = Number(localStorage.getItem(storageKeys.passwordResetOtpExpiresAt) ?? 0);

  if (!Number.isFinite(expiresAt) || expiresAt <= 0) return 0;

  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
};

const setOtpExpiry = () => {
  localStorage.setItem(storageKeys.passwordResetOtpExpiresAt, String(Date.now() + otpCountdownDurationMs));
};

const formatCountdown = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

interface OtpInputProps {
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const OtpInput = ({ value, error, disabled, onChange }: OtpInputProps) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 4 }, (_, index) => value[index] ?? '');

  const updateDigit = (index: number, nextValue: string) => {
    const digit = nextValue.replace(/\D/g, '').slice(-1);
    const nextDigits = [...digits];

    nextDigits[index] = digit;
    onChange(nextDigits.join(''));

    if (digit && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4).split('');
    const nextDigits = Array.from({ length: 4 }, (_, index) => pastedDigits[index] ?? '');

    onChange(nextDigits.join(''));
    inputRefs.current[Math.min(pastedDigits.length, 3)]?.focus();
  };

  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-bold text-[#0B1F4A]">Verification Code</span>
      <div className="grid grid-cols-4 gap-3">
        {digits.map((digit, index) => (
          <input
            aria-label={`Verification code digit ${index + 1}`}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            className={clsx(
              'h-14 rounded-lg border bg-white text-center text-xl font-black text-[#0B1F4A] outline-none transition focus:border-[#123B8D] focus:ring-4 focus:ring-[#123B8D]/10',
              error ? 'border-[#DC2626]' : 'border-[#D5DCE8]',
            )}
            disabled={disabled}
            inputMode="numeric"
            key={index}
            maxLength={1}
            pattern="[0-9]*"
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            value={digit}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !digits[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
              }
            }}
            onPaste={handlePaste}
          />
        ))}
      </div>
      {error && <span className="text-xs text-[#DC2626]">{error}</span>}
    </div>
  );
};

export default function ResetPasswordPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { error, forgotPasswordLoading, setPasswordLoading } = useAppSelector((state) => state.auth);
  const email = (location.state as { email?: string } | null)?.email ?? getStoredResetEmail();
  const [remainingSeconds, setRemainingSeconds] = useState(getOtpRemainingSeconds);
  const { control, register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { token: '', password: '', confirmPassword: '' },
  });
  const canResend = Boolean(email) && remainingSeconds <= 0 && !forgotPasswordLoading;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRemainingSeconds(getOtpRemainingSeconds());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const onSubmit = async (values: FormValues) => {
    if (!email) {
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Email missing',
          message: 'Please start password reset again with your email.',
        }),
      );
      navigate(paths.forgotPassword, { replace: true });
      return;
    }

    dispatch(clearAuthError());

    try {
      const result = await dispatch(
        setPasswordThunk({
          email,
          password: values.password,
          token: values.token,
        }),
      ).unwrap();

      dispatch(
        pushNotification({
          type: 'success',
          title: 'Password reset',
          message: result.message,
        }),
      );
      navigate(paths.login, { replace: true });
      localStorage.removeItem(storageKeys.passwordResetEmail);
      localStorage.removeItem(storageKeys.passwordResetOtpExpiresAt);
    } catch {
      // The auth slice exposes the form error.
    }
  };

  const resendOtp = async () => {
    if (!email || !canResend) return;

    dispatch(clearAuthError());

    try {
      const result = await dispatch(forgotPasswordThunk({ email })).unwrap();
      localStorage.setItem(storageKeys.passwordResetEmail, email);
      setOtpExpiry();
      setRemainingSeconds(getOtpRemainingSeconds());

      dispatch(
        pushNotification({
          type: 'success',
          title: 'Code resent',
          message: result.message,
        }),
      );
    } catch {
      // The auth slice exposes the form error.
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Create a new password for your account">
      <div className={authCardClass}>
        {error && <div className={authErrorClass}>{error}</div>}
        {!email && <div className={authErrorClass}>Please start password reset again with your email.</div>}
        <form className={authFormClass} onSubmit={handleSubmit(onSubmit)}>
          {email && (
            <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">Email</span>
              <p className="m-0 mt-1 text-sm font-bold text-[#0B1F4A]">{email}</p>
            </div>
          )}
          <Controller
            control={control}
            name="token"
            render={({ field }) => (
              <OtpInput
                disabled={setPasswordLoading}
                error={formState.errors.token?.message}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#5A6880]">
              {remainingSeconds > 0 ? `Resend code in ${formatCountdown(remainingSeconds)}` : 'Did not receive the code?'}
            </span>
            <button
              className="border-0 bg-transparent p-0 text-sm font-black text-[#123B8D] transition disabled:cursor-not-allowed disabled:text-[#8A96AA]"
              disabled={!canResend}
              type="button"
              onClick={resendOtp}
            >
              {forgotPasswordLoading ? 'Sending...' : 'Resend code'}
            </button>
          </div>
          <AppInput
            label="New Password"
            type="password"
            autoComplete="new-password"
            error={formState.errors.password?.message}
            {...register('password')}
          />
          <AppInput
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            error={formState.errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <AppButton fullWidth loading={setPasswordLoading} type="submit">
            Reset Password
          </AppButton>
        </form>
        <Link className={authLinkClass} to={paths.login}>
          Return to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
