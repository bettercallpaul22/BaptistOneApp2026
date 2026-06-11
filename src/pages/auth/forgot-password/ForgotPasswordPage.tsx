import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AppButton } from '@/components/common';
import { AppInput } from '@/components/form';
import { AuthLayout } from '@/layouts/AuthLayout';
import { paths } from '@/routes/paths';
import { authCardClass, authErrorClass, authFormClass, authLinkClass } from '../authClasses';

const schema = z.object({ identifier: z.string().min(3, 'Enter your email or phone number') });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <AuthLayout title="Forgot Password" subtitle="We will send a verification code to your account">
      <div className={authCardClass}>
        {notice && <div className={authErrorClass}>{notice}</div>}
        <form
          className={authFormClass}
          onSubmit={handleSubmit(({ identifier }) => {
            setLoading(true);
            setNotice('Password reset is not available yet. Keep this email or phone number ready for the next step.');
            window.setTimeout(() => {
              setLoading(false);
              navigate(paths.verifyOtp, { state: { identifier } });
            }, 400);
          })}
        >
          <AppInput
            label="Email or Phone Number"
            placeholder="Enter your email or phone"
            error={formState.errors.identifier?.message}
            {...register('identifier')}
          />
          <AppButton fullWidth loading={loading} type="submit">
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
