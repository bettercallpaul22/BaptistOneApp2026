import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Wallet, CreditCard } from 'lucide-react';
import clsx from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppModal } from '@/components/feedback';
import { AppInput } from '@/components/form';
import { AppShell } from '@/layouts/AppShell';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearRegistrationResult } from '@/store/slices/conventionSlice';
import { registerForProgramThunk } from '@/store/thunks/conventionThunk';
import { fetchWalletsThunk } from '@/store/thunks/walletThunk';
import { pushNotification } from '@/store/slices/notificationSlice';
import { paths } from '@/routes/paths';
import { callbackUrls } from '@/constants/callbackUrls';
import type { ConventionProgram, AttendanceMode } from '@/types/convention';

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};

const attendanceOptions: Array<{ label: string; value: AttendanceMode }> = [
  { label: 'In-Person', value: 'PHYSICAL' },
  { label: 'Online', value: 'ONLINE' },
];

type PaymentMethod = 'wallet' | 'paystack';

export default function ConventionRegistrationPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const program = (location.state as { program?: ConventionProgram } | null)?.program;

  const { registrationLoading, registrationError, registrationResult } = useAppSelector(
    (state) => state.convention,
  );
  const wallets = useAppSelector((state) => state.wallet.items);
  const walletBalance = wallets[0]?.balance ?? 0;
  const walletCurrency = wallets[0]?.currency ?? 'NGN';
  const conventionId = useAppSelector((state) => state.convention.conventionId);

  const [attendanceMode, setAttendanceMode] = useState<AttendanceMode>(
    program?.attendanceMode === 'BOTH' ? 'PHYSICAL' : (program?.attendanceMode ?? 'PHYSICAL'),
  );
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [submittingPin, setSubmittingPin] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    dispatch(fetchWalletsThunk());
  }, [dispatch]);

  useEffect(() => {
    if (registrationResult?.data?.checkoutUrl) {
      window.location.assign(registrationResult.data.checkoutUrl);
    } else if (registrationResult && !registrationResult.data?.checkoutUrl) {
      dispatch(
        pushNotification({
          type: 'success',
          title: 'Registration successful',
          message: 'You have been registered for this program.',
        }),
      );
      dispatch(clearRegistrationResult());
      navigate(paths.convention);
    }
  }, [registrationResult, dispatch, navigate]);

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateForm = useCallback((): boolean => {
    if (!program) return false;
    const errors: Record<string, string> = {};
    for (const field of program.registrationFields) {
      if (field.required && !formValues[field.key]?.trim()) {
        errors[field.key] = `${field.label} is required`;
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [program, formValues]);

  const handleRegister = useCallback(
    async (method: PaymentMethod, authKey?: string) => {
      if (!program || !conventionId) return;
      if (!validateForm()) return;

      const totalAmount = program.basePrice;
      const payload = {
        attendanceMode,
        responses: formValues,
        totalAmount,
        currency: program.currency,
        paymentMethod: method,
        ...(authKey ? { authKey } : {}),
        ...(method === 'paystack' ? { callbackUrl: callbackUrls.convention() } : {}),
      };

      dispatch(registerForProgramThunk({ conventionId, programId: program.id, payload }));
    },
    [program, conventionId, attendanceMode, formValues, validateForm, dispatch],
  );

  const handleSubmit = useCallback(() => {
    if (paymentMethod === 'wallet') {
      setIsPinModalOpen(true);
    } else {
      void handleRegister('paystack');
    }
  }, [paymentMethod, handleRegister]);

  const handleSubmitPin = async () => {
    if (pinValue.length !== 4 || !program || !conventionId) return;
    setSubmittingPin(true);
    setPinError('');
    const payload = {
      attendanceMode,
      responses: formValues,
      totalAmount: program.basePrice,
      currency: program.currency,
      paymentMethod: 'wallet' as const,
      authKey: pinValue,
    };
    const result = await dispatch(registerForProgramThunk({ conventionId, programId: program.id, payload }));
    setSubmittingPin(false);
    if (registerForProgramThunk.fulfilled.match(result)) {
      setPinValue('');
      setIsPinModalOpen(false);
    } else {
      setPinError(getErrorMessage(result.payload, 'Registration failed.'));
    }
  };

  if (!program) {
    return (
      <AppShell>
        <main className="grid min-h-[65vh] place-items-center px-4">
          <AppText variant="h5" align="center">Program not found</AppText>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto grid w-full max-w-[38rem] gap-5 px-4 py-6 pb-44 sm:px-6 md:py-9">
        <header className="flex items-start gap-3">
          <button
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#E5E7EB] bg-white text-[#123B8D] transition hover:bg-slate-50"
            type="button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="grid min-w-0 gap-1">
            <AppText variant="h4">{program.title}</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              {program.basePrice > 0 ? formatMoney(program.basePrice, program.currency) : 'Free'}
            </AppText>
          </div>
        </header>

        {program.description && (
          <AppText variant="bodyMedium" color="textSecondary">{program.description}</AppText>
        )}

        {program.attendanceMode === 'BOTH' && (
          <div className="grid gap-2">
            <AppText variant="subtitle">Attendance Mode</AppText>
            <div className="flex rounded-xl bg-[#F1F5F9] p-1">
              {attendanceOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={clsx(
                    'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all',
                    attendanceMode === opt.value
                      ? 'bg-[#123B8D] text-white shadow-[0_2px_8px_rgba(18,59,141,0.25)]'
                      : 'text-[#5A6880] hover:text-[#0B1F4A]',
                  )}
                  type="button"
                  onClick={() => setAttendanceMode(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {program.registrationFields.length > 0 && (
          <div className="grid gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
            <AppText variant="h6" className="font-bold text-[#0B1F4A]">Registration Details</AppText>
            {program.registrationFields.map((field) => (
              <div key={field.key} className="grid gap-2">
                {field.type === 'textarea' ? (
                  <label className="grid gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">
                      {field.label}{field.required && ' *'}
                    </span>
                    <textarea
                      className="min-h-20 resize-none rounded-xl border border-[#D6DEEB] bg-[#F8FAFC] p-3 text-sm font-semibold text-[#0B1F4A] outline-none transition placeholder:text-[#A8B3C4] focus:border-[#123B8D] focus:ring-3 focus:ring-[#123B8D]/10"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={formValues[field.key] ?? ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    />
                    {formErrors[field.key] && (
                      <AppText variant="caption" color="#B91C1C">{formErrors[field.key]}</AppText>
                    )}
                  </label>
                ) : field.type === 'select' && field.options ? (
                  <label className="grid gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">
                      {field.label}{field.required && ' *'}
                    </span>
                    <select
                      className="rounded-xl border border-[#D6DEEB] bg-[#F8FAFC] p-3 text-sm font-semibold text-[#0B1F4A] outline-none transition focus:border-[#123B8D] focus:ring-3 focus:ring-[#123B8D]/10"
                      value={formValues[field.key] ?? ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    >
                      <option value="">Select {field.label.toLowerCase()}</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {formErrors[field.key] && (
                      <AppText variant="caption" color="#B91C1C">{formErrors[field.key]}</AppText>
                    )}
                  </label>
                ) : (
                  <AppInput
                    label={`${field.label}${field.required ? ' *' : ''}`}
                    type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    value={formValues[field.key] ?? ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    error={formErrors[field.key]}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {program.basePrice > 0 && (
          <div className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
            <AppText variant="h6" className="font-bold text-[#0B1F4A]">Payment Method</AppText>
            <div className="flex rounded-xl bg-[#F1F5F9] p-1">
              <button
                className={clsx(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all',
                  paymentMethod === 'wallet'
                    ? 'bg-[#123B8D] text-white shadow-[0_2px_8px_rgba(18,59,141,0.25)]'
                    : 'text-[#5A6880] hover:text-[#0B1F4A]',
                )}
                type="button"
                onClick={() => setPaymentMethod('wallet')}
              >
                <Wallet className="size-4" /> Wallet
              </button>
              <button
                className={clsx(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all',
                  paymentMethod === 'paystack'
                    ? 'bg-[#123B8D] text-white shadow-[0_2px_8px_rgba(18,59,141,0.25)]'
                    : 'text-[#5A6880] hover:text-[#0B1F4A]',
                )}
                type="button"
                onClick={() => setPaymentMethod('paystack')}
              >
                <CreditCard className="size-4" /> Card
              </button>
            </div>
            {paymentMethod === 'wallet' && (
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                <div className="flex items-center justify-between">
                  <AppText variant="bodySmall" color="textSecondary">Wallet balance</AppText>
                  <AppText variant="bodySmall" weight="bold">
                    {formatMoney(walletBalance / 100, walletCurrency)}
                  </AppText>
                </div>
              </div>
            )}
          </div>
        )}

        {registrationError && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3">
            <AppText variant="bodySmall" color="#991B1B">{registrationError}</AppText>
          </div>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-[6.5rem] z-30 border-t border-[#E5E7EB] bg-white px-4 py-4 shadow-[0_-8px_24px_rgba(11,31,74,0.1)]">
        <div className="mx-auto grid w-full max-w-[38rem]">
          <AppButton
            fullWidth
            size="md"
            loading={registrationLoading}
            onClick={handleSubmit}
          >
            {program.basePrice === 0 ? 'Register for Free' : 'Confirm Registration'}
          </AppButton>
        </div>
      </div>

      <AppModal
        open={isPinModalOpen}
        title="Enter Wallet PIN"
        onClose={() => { setIsPinModalOpen(false); setPinValue(''); setPinError(''); }}
        footer={
          <>
            <AppButton variant="secondary" onClick={() => { setIsPinModalOpen(false); setPinValue(''); setPinError(''); }}>Cancel</AppButton>
            <AppButton loading={submittingPin} disabled={pinValue.length !== 4} onClick={() => void handleSubmitPin()}>Confirm</AppButton>
          </>
        }
      >
        <div className="grid gap-4">
          <AppText variant="bodyMedium" color="textSecondary">
            Enter your 4-digit wallet PIN to confirm registration.
          </AppText>
          {pinError && <AppText variant="bodySmall" color="#B91C1C">{pinError}</AppText>}
          <AppInput
            label="Wallet PIN"
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="4-digit PIN"
            value={pinValue}
            onChange={(e) => { setPinValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 4)); setPinError(''); }}
          />
        </div>
      </AppModal>
    </AppShell>
  );
}
