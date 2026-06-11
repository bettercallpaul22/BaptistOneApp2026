import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AppButton } from '@/components/common';
import { AppInput } from '@/components/form';
import { AuthLayout } from '@/layouts/AuthLayout';
import { paths } from '@/routes/paths';
import { authCardClass, authErrorClass, authFormClass } from '../authClasses';

const schema = z.object({
  identifier: z.string().min(3),
  otp: z.string().min(4, 'Enter the OTP code'),
});
type FormValues = z.infer<typeof schema>;

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: (location.state as { identifier?: string } | null)?.identifier ?? '', otp: '' },
  });

  return (
    <AuthLayout title="Verify OTP" subtitle="Enter the verification code sent to you">
      <div className={authCardClass}>
        {notice && <div className={authErrorClass}>{notice}</div>}
        <form
          className={authFormClass}
          onSubmit={handleSubmit(() => {
            setLoading(true);
            setNotice('OTP verification is not connected to the new auth API yet.');
            window.setTimeout(() => {
              setLoading(false);
              navigate(paths.resetPassword);
            }, 400);
          })}
        >
          <AppInput label="Email or Phone" error={formState.errors.identifier?.message} {...register('identifier')} />
          <AppInput label="OTP Code" inputMode="numeric" error={formState.errors.otp?.message} {...register('otp')} />
          <AppButton fullWidth loading={loading} type="submit">
            Verify Code
          </AppButton>
        </form>
      </div>
    </AuthLayout>
  );
}
