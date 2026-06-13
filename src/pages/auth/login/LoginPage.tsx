import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import appleIcon from '@/assets/icons/apple_icon.svg';
import googleIcon from '@/assets/icons/google_icon.svg';
import { AppButton } from '@/components/common';
import { AppCheckbox, AppInput } from '@/components/form';
import { AuthLayout } from '@/layouts/AuthLayout';
import { paths } from '@/routes/paths';
import { loginThunk } from '@/store/thunks/authThunk';
import { pushNotification } from '@/store/slices/notificationSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { authCardClass, authDividerClass, authErrorClass, authFooterClass, authFormClass, authLinkClass, authMutedLinkClass, authSocialsClass } from '../authClasses';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof schema>;

const SocialIcon = ({ src, alt }: { src: string; alt: string }) => (
  <img className="size-4 shrink-0" src={src} alt={alt} />
);

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useAppSelector((state) => state.auth);
  const { register, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  const onSubmit = useCallback(
    async ({ email, password }: LoginForm) => {
      try {
        await dispatch(loginThunk({ email, password })).unwrap();
        dispatch(pushNotification({ type: 'success', title: 'Signed in', message: 'Welcome back to BaptistOne.' }));

        const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? paths.home;
        navigate(from, { replace: true });
      } catch (error) {
        const message = (error as { message?: string })?.message ?? 'Check your email and password, then try again.';
        dispatch(pushNotification({ type: 'error', title: 'Sign in failed', message }));
      }
    },
    [dispatch, location.state, navigate],
  );

  return (
    <AuthLayout title="Sign In" subtitle="Access your church community, Bible, hymns, events and more.">
      <div className={authCardClass}>
        {error && <div className={authErrorClass}>{error}</div>}
        <form className={authFormClass} onSubmit={handleSubmit(onSubmit)}>
          <AppInput
            autoComplete="email"
            label="Email Address"
            placeholder="johnpaul@example.com"
            error={formState.errors.email?.message}
            {...register('email')}
          />
          <AppInput
            label="Password"
            placeholder="Enter password"
            type="password"
            error={formState.errors.password?.message}
            {...register('password')}
          />
          <div className="flex items-center justify-between gap-3">
            <AppCheckbox label="Remember me" {...register('rememberMe')} />
            <Link className={authLinkClass} to={paths.forgotPassword}>
              Forgot Password?
            </Link>
          </div>
          <AppButton fullWidth loading={loading} type="submit">
            Login
          </AppButton>
        </form>
        <div className={authDividerClass}>or continue with</div>
        <div className={authSocialsClass}>
          <AppButton fullWidth leftIcon={<SocialIcon src={googleIcon} alt="" />} variant="outline">
            Google
          </AppButton>
          <AppButton fullWidth leftIcon={<SocialIcon src={appleIcon} alt="" />} variant="outline">
            Apple
          </AppButton>
        </div>
        <div className={authFooterClass}>
          <span>Don&apos;t have an account?</span>
          <Link className={authMutedLinkClass} to={paths.register}>
            Create Account
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
