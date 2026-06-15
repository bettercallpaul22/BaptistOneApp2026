import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import clsx from 'clsx';
import appleIcon from '@/assets/icons/apple_icon.svg';
import googleIcon from '@/assets/icons/google_icon.svg';
import { AppButton } from '@/components/common';
import { AppDropdown, AppInput } from '@/components/form';
import { AuthLayout } from '@/layouts/AuthLayout';
import { paths } from '@/routes/paths';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { registerThunk } from '@/store/thunks/authThunk';
import { pushNotification } from '@/store/slices/notificationSlice';
import {
  authCardClass,
  authDividerClass,
  authErrorClass,
  authFooterClass,
  authFormClass,
  authLinkClass,
  authSocialsClass,
} from '../authClasses';

const SUPPORTED_COUNTRY_CODES = ['NG', 'GH', 'KE', 'ZA', 'GB', 'US', 'CA'] as const;

type CountryCode = (typeof SUPPORTED_COUNTRY_CODES)[number];

const COUNTRY_OPTIONS: Array<{
  label: string;
  value: CountryCode;
  dialCode: string;
  placeholder: string;
}> = [
  { label: 'Nigeria (+234)',        value: 'NG', dialCode: '+234', placeholder: '8012345678'  },
  { label: 'Ghana (+233)',          value: 'GH', dialCode: '+233', placeholder: '241234567'   },
  { label: 'Kenya (+254)',          value: 'KE', dialCode: '+254', placeholder: '712345678'   },
  { label: 'South Africa (+27)',    value: 'ZA', dialCode: '+27',  placeholder: '821234567'   },
  { label: 'United Kingdom (+44)', value: 'GB', dialCode: '+44',  placeholder: '7123456789'  },
  { label: 'United States (+1)',    value: 'US', dialCode: '+1',   placeholder: '2025550123'  },
  { label: 'Canada (+1)',           value: 'CA', dialCode: '+1',   placeholder: '4165550123'  },
];

const cleanLocalPhone = (phone: string) =>
  phone.replace(/[\s\-()]/g, '').replace(/^\+/, '').replace(/^0+/, '');

const normalizePhone = (phone: string, countryCode: CountryCode) => {
  const country = COUNTRY_OPTIONS.find((o) => o.value === countryCode) ?? COUNTRY_OPTIONS[0];
  const dialDigits = country.dialCode.replace(/\D/g, '');
  const localDigits = cleanLocalPhone(phone).replace(/\D/g, '');
  const withoutDial = localDigits.startsWith(dialDigits)
    ? localDigits.slice(dialDigits.length).replace(/^0+/, '')
    : localDigits;
  return `${country.dialCode}${withoutDial}`;
};

const schema = z.object({
  fullName:    z.string().min(2, 'Enter your full name'),
  email:       z.string().email('Enter a valid email address'),
  phone:       z.string().refine((v) => cleanLocalPhone(v).replace(/\D/g, '').length >= 7, 'Enter a valid mobile number'),
  countryCode: z.enum(SUPPORTED_COUNTRY_CODES, { message: 'Select your country' }),
  password:    z.string().min(6, 'At least 6 characters'),
});

type RegisterForm = z.infer<typeof schema>;

const SocialIcon = ({ src, alt }: { src: string; alt: string }) => (
  <img className="size-4 shrink-0" src={src} alt={alt} />
);

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { registerLoading, error } = useAppSelector((state) => state.auth);

  const { register, handleSubmit, formState, setValue, control } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', phone: '', countryCode: 'NG', password: '' },
  });

  const selectedCountryCode = useWatch({ control, name: 'countryCode' });
  const selectedCountry = COUNTRY_OPTIONS.find((o) => o.value === selectedCountryCode) ?? COUNTRY_OPTIONS[0];

  // Track phone value for has-value border state
  const phoneValue = useWatch({ control, name: 'phone' });
  const phoneHasValue = cleanLocalPhone(phoneValue ?? '').length > 0;
  const phoneHasError = Boolean(formState.errors.phone);

  const onSubmit = useCallback(
    async (values: RegisterForm) => {
      try {
        const result = await dispatch(
          registerThunk({ ...values, phone: normalizePhone(values.phone, values.countryCode) }),
        ).unwrap();
        dispatch(pushNotification({ type: 'success', title: 'Check your email', message: result.message }));
        navigate(paths.registerVerification, { state: { email: values.email }, replace: true });
      } catch (err) {
        const message = (err as { message?: string })?.message ?? 'Please check your details and try again.';
        dispatch(pushNotification({ type: 'error', title: 'Registration failed', message }));
      }
    },
    [dispatch, navigate],
  );

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join your church community in seconds"
      contentClassName="md:max-w-[42rem]"
    >
      <div className={clsx(authCardClass, 'md:p-6')}>
        <div className={authSocialsClass}>
          <AppButton fullWidth leftIcon={<SocialIcon src={googleIcon} alt="" />} variant="outline">
            Continue with Google
          </AppButton>
          <AppButton fullWidth leftIcon={<SocialIcon src={appleIcon} alt="" />} variant="outline">
            Continue with Apple
          </AppButton>
        </div>

        <div className={authDividerClass}>Or</div>

        {error && <div className={authErrorClass}>{error}</div>}

        <form className={authFormClass} onSubmit={handleSubmit(onSubmit)}>
          <AppInput
            label="Full Name"
            placeholder="John Doe"
            error={formState.errors.fullName?.message}
            {...register('fullName')}
          />
          <AppInput
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            inputMode="email"
            label="Email Address"
            lowercase
            placeholder="maryjane@example.com"
            spellCheck={false}
            error={formState.errors.email?.message}
            {...register('email')}
          />
          <AppDropdown
            label="Country"
            options={COUNTRY_OPTIONS}
            placeholder="Select your country"
            searchable
            value={selectedCountryCode}
            error={formState.errors.countryCode?.message}
            onChange={(value) => {
              if (typeof value === 'string') {
                setValue('countryCode', value as CountryCode, { shouldDirty: true, shouldValidate: true });
              }
            }}
          />

          {/* Phone field — inline, consistent with AppInput styling */}
          <label className="grid gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">
              Mobile Number
            </span>
            <span
              className={clsx(
                'flex min-h-11 items-center rounded-[10px] border-[1.5px] bg-white transition-all duration-150',
                'focus-within:border-[#123B8D] focus-within:ring-3 focus-within:ring-[#123B8D]/10',
                phoneHasError
                  ? 'border-[#DC2626] focus-within:border-[#DC2626] focus-within:ring-[#DC2626]/10'
                  : phoneHasValue
                  ? 'border-[#9BAAC0]'
                  : 'border-[#D5DCE8]',
              )}
            >
              <span className="shrink-0 border-r border-[#D5DCE8] px-3.5 text-sm font-semibold text-[#0B1F4A]">
                {selectedCountry.dialCode}
              </span>
              <input
                autoComplete="tel-national"
                className="min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-3 pr-3.5 text-sm text-[#0B1F4A] outline-none placeholder:text-[#A8B3C4]"
                placeholder={selectedCountry.placeholder}
                aria-invalid={phoneHasError}
                aria-describedby={phoneHasError ? 'register-phone-message' : undefined}
                {...register('phone')}
              />
            </span>
            {formState.errors.phone?.message && (
              <span id="register-phone-message" className="mt-0.5 text-[11.5px] text-[#DC2626]">
                {formState.errors.phone.message}
              </span>
            )}
          </label>

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
