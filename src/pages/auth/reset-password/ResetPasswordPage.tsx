import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AppButton } from '@/components/common';
import { AppInput } from '@/components/form';
import { AuthLayout } from '@/layouts/AuthLayout';
import { paths } from '@/routes/paths';
import { authCardClass, authErrorClass, authFormClass, authLinkClass } from '../authClasses';

const schema = z.object({
  token: z.string().min(1, 'Missing reset token'),
  password: z.string().min(8, 'At least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { token: (location.state as { token?: string } | null)?.token ?? '', password: '' },
  });

  return (
    <AuthLayout title="Reset Password" subtitle="Create a new password for your account">
      <div className={authCardClass}>
        {notice && <div className={authErrorClass}>{notice}</div>}
        <form
          className={authFormClass}
          onSubmit={handleSubmit(() => {
            setLoading(true);
            setNotice('Password reset is not connected to the new auth API yet.');
            window.setTimeout(() => {
              setLoading(false);
              navigate(paths.login);
            }, 400);
          })}
        >
          <AppInput label="Reset Token" error={formState.errors.token?.message} {...register('token')} />
          <AppInput
            label="New Password"
            type="password"
            error={formState.errors.password?.message}
            {...register('password')}
          />
          <AppButton fullWidth loading={loading} type="submit">
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
