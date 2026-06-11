import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AppButton } from '@/components/common';
import { AppInput } from '@/components/form';
import { AuthLayout } from '@/layouts/AuthLayout';
import { paths } from '@/routes/paths';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { registerThunk } from '@/store/thunks/authThunk';
import { pushNotification } from '@/store/slices/notificationSlice';
import { authCardClass, authDividerClass, authErrorClass, authFooterClass, authFormClass, authLinkClass, authSocialsClass } from '../authClasses';

const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(8, 'Enter your phone number'),
  countryCode: z.string().min(2, 'Enter your country code').max(3, 'Use a valid country code'),
  password: z.string().min(6, 'At least 6 characters'),
});

type RegisterForm = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { registerLoading, error } = useAppSelector((state) => state.auth);
  const { register, handleSubmit, formState } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', phone: '', countryCode: 'NG', password: '' },
  });

  const onSubmit = useCallback(
    async (values: RegisterForm) => {
      try {
        const result = await dispatch(registerThunk(values)).unwrap();
        dispatch(pushNotification({ type: 'success', title: 'Check your email', message: result.message }));
        navigate(paths.registerVerification, { state: { email: values.email }, replace: true });
      } catch (error) {
        const message = (error as { message?: string })?.message ?? 'Please check your details and try again.';
        dispatch(pushNotification({ type: 'error', title: 'Registration failed', message }));
      }
    },
    [dispatch, navigate],
  );

  return (
    <AuthLayout title="Create Your Account" subtitle="Join your church community in seconds">
      <div className={authCardClass}>
        <div className={authSocialsClass}>
          <AppButton variant="outline">Continue with Google</AppButton>
          <AppButton variant="outline">Continue with Apple</AppButton>
        </div>
        <div className={authDividerClass}>Or</div>
        {error && <div className={authErrorClass}>{error}</div>}
        <form className={authFormClass} onSubmit={handleSubmit(onSubmit)}>
          <AppInput label="Full Name" placeholder="John Doe" error={formState.errors.fullName?.message} {...register('fullName')} />
          <AppInput
            autoComplete="email"
            label="Email Address"
            placeholder="maryjane@example.com"
            error={formState.errors.email?.message}
            {...register('email')}
          />
          <AppInput
            autoComplete="tel"
            label="Phone Number"
            placeholder="+2348012345678"
            error={formState.errors.phone?.message}
            {...register('phone')}
          />
          <AppInput
            autoComplete="country"
            label="Country Code"
            placeholder="NG"
            error={formState.errors.countryCode?.message}
            {...register('countryCode')}
          />
          <AppInput
            label="Password"
            placeholder="Enter password"
            type="password"
            helperText="At least 6 characters"
            error={formState.errors.password?.message}
            {...register('password')}
          />
          <AppButton fullWidth loading={registerLoading} type="submit">
            Create Account
          </AppButton>
        </form>
        <div className={authFooterClass}>
          <span>Already have an account?</span>
          <Link className={authLinkClass} to={paths.login}>
            Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
