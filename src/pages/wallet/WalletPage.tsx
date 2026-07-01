import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  KeyRound,
  List,
  Plus,
  RefreshCw,
  Wallet as WalletIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppLoader, AppModal } from '@/components/feedback';
import { AppDropdown, AppInput, AppMoneyInput } from '@/components/form';
import { callbackUrls } from '@/constants/callbackUrls';
import { AppShell } from '@/layouts/AppShell';
import { paths } from '@/routes/paths';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearCreateWalletStatus,
  clearWalletError,
  clearWalletFundingStatus,
  setWalletCurrency,
} from '@/store/slices/walletSlice';
import { pushNotification } from '@/store/slices/notificationSlice';
import { createWalletThunk, fetchWalletsThunk, fundWalletThunk, setWalletPinThunk, verifyWalletPinThunk } from '@/store/thunks/walletThunk';
import type { Wallet, WalletCreateCurrency } from '@/types/wallet';

const currencyOptions: Array<{ label: string; value: WalletCreateCurrency }> = [
  { label: 'NGN', value: 'NGN' },
  { label: 'USD', value: 'USD' },
];

const minorUnitMultiplier = 100;

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
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

const toMinorCurrencyUnit = (amount: number) => Math.round(amount * minorUnitMultiplier);

const formatMinorMoney = (value: number, currency: string) => formatMoney(value / minorUnitMultiplier, currency);

const WalletMetric = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) => (
  <div className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_18px_rgba(11,31,74,0.05)]">
    <div className="flex items-center gap-2 text-[#123B8D]">
      {icon}
      <AppText variant="caption" color="textMuted" weight="bold">
        {label}
      </AppText>
    </div>
    <AppText variant="h5">{value}</AppText>
  </div>
);

const FundingDetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="grid gap-1 border-b border-[#E5E7EB] py-3 last:border-b-0">
    <AppText variant="caption" color="textMuted" weight="bold">
      {label}
    </AppText>
    <AppText variant="bodyMedium" className="break-words">
      {value || 'Not provided'}
    </AppText>
  </div>
);

const WalletSummary = ({
  wallet,
  featured = false,
  onFundWallet,
  onViewTransactions,
  onSetPin,
}: {
  wallet: Wallet;
  featured?: boolean;
  onFundWallet: (wallet: Wallet) => void;
  onViewTransactions: (wallet: Wallet) => void;
  onSetPin: (wallet: Wallet) => void;
}) => (
  <section className="grid gap-4 rounded-xl border border-[#D6DEEB] bg-white p-4 shadow-[0_12px_28px_rgba(11,31,74,0.08)] sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#EAF1FF] text-[#123B8D]">
          <WalletIcon className="size-6" aria-hidden />
        </span>
        <div className="grid min-w-0 gap-1">
          <AppText variant={featured ? 'h4' : 'h5'}>{wallet.displayName || `${wallet.currency} Wallet`}</AppText>
          <AppText variant="bodySmall" color="textMuted">
            Wallet No. {wallet.walletNumber || 'Not provided'}
          </AppText>
        </div>
      </div>
      <AppButton
        size="sm"
        variant="outline"
        leftIcon={<KeyRound className="size-3.5" aria-hidden />}
        onClick={() => onSetPin(wallet)}
      >
        Set Pin
      </AppButton>
    </div>

    <div className="grid gap-1 rounded-xl bg-[#0B1F4A] p-4 text-white">
      <AppText variant="caption" color="#D8E4FF" weight="bold">
        Available Balance
      </AppText>
      <AppText variant={featured ? 'displaySmall' : 'h3'} color="textInverse">
        {formatMinorMoney(wallet.balance, wallet.currency)}
      </AppText>
      <AppText variant="bodySmall" color="#D8E4FF">
        {wallet.currency} wallet
      </AppText>
    </div>

    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <AppButton leftIcon={<Plus className="size-4" aria-hidden />} size="md" onClick={() => onFundWallet(wallet)}>
          Fund wallet
        </AppButton>
        <AppButton leftIcon={<ArrowDownLeft className="size-4" aria-hidden />} size="md" variant="secondary">
          Withdraw
        </AppButton>
      </div>
      <AppButton leftIcon={<List className="size-4" aria-hidden />} size="md" variant="outline" onClick={() => onViewTransactions(wallet)}>
        View transactions
      </AppButton>
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
      <WalletMetric
        icon={<ArrowUpRight className="size-4" aria-hidden />}
        label="Total Credit"
        value={formatMinorMoney(wallet.totalCredit, wallet.currency)}
      />
      <WalletMetric
        icon={<ArrowDownLeft className="size-4" aria-hidden />}
        label="Total Debit"
        value={formatMinorMoney(wallet.totalDebit, wallet.currency)}
      />
    </div>
  </section>
);

export default function WalletPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    createError,
    createLoading,
    createSuccessMessage,
    error,
    fundingError,
    fundingLoading,
    fundingResult,
    items,
    lastFetchedAt,
    loading,
    selectedCurrency,
  } = useAppSelector((state) => state.wallet);
  const [fundingWallet, setFundingWallet] = useState<Wallet | null>(null);
  const [fundingAmount, setFundingAmount] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [confirmPinValue, setConfirmPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [settingPin, setSettingPin] = useState(false);
  const [pinMode, setPinMode] = useState<'set' | 'verify'>('set');
  const primaryWallet = items[0] ?? null;
  const otherWallets = items.slice(1);
  const fundingAmountMajor = Number(fundingAmount || 0);
  const fundingAmountMinor = toMinorCurrencyUnit(fundingAmountMajor);
  const fundingTransaction = fundingResult?.data.transaction;
  const fundingFees = fundingTransaction?.fees ?? [];
  const canSubmitFunding = Boolean(fundingWallet?.walletNumber) && fundingAmountMajor > 0 && !fundingLoading;

  useEffect(() => {
    if (lastFetchedAt || loading) return;
    dispatch(fetchWalletsThunk());
  }, [dispatch, lastFetchedAt, loading]);

  const retryWallets = useCallback(() => {
    dispatch(clearWalletError());
    dispatch(fetchWalletsThunk());
  }, [dispatch]);

  const openFundingModal = useCallback(
    (wallet: Wallet) => {
      dispatch(clearWalletFundingStatus());
      setFundingWallet(wallet);
      setFundingAmount('');
    },
    [dispatch],
  );

  const closeFundingModal = useCallback(() => {
    dispatch(clearWalletFundingStatus());
    setFundingWallet(null);
    setFundingAmount('');
  }, [dispatch]);

  const openTransactionsPage = useCallback(
    (wallet: Wallet) => {
      navigate(paths.walletTransactions(wallet.walletNumber), { state: { wallet } });
    },
    [navigate],
  );

  const openPinModal = useCallback((wallet: Wallet) => {
    setIsPinModalOpen(true);
    setPinValue('');
    setConfirmPinValue('');
    setPinError('');
    setPinMode('set');
  }, []);

  const handlePinChange = (value: string) => {
    const numeric = value.replace(/[^0-9]/g, '').slice(0, 4);
    setPinValue(numeric);
    if (confirmPinValue && numeric !== confirmPinValue) {
      setPinError('PINs do not match');
    } else {
      setPinError('');
    }
  };

  const handleConfirmPinChange = (value: string) => {
    const numeric = value.replace(/[^0-9]/g, '').slice(0, 4);
    setConfirmPinValue(numeric);
    if (pinValue && numeric !== pinValue) {
      setPinError('PINs do not match');
    } else {
      setPinError('');
    }
  };

  const canSetPin = pinValue.length === 4 && confirmPinValue.length === 4 && pinValue === confirmPinValue && !settingPin;

  const handleSetPin = async () => {
    if (!canSetPin) return;

    setSettingPin(true);
    setPinError('');

    try {
      await dispatch(setWalletPinThunk({ authKey: pinValue })).unwrap();
      dispatch(pushNotification({ type: 'success', title: 'PIN set', message: 'Your wallet PIN has been set successfully.' }));
      setIsPinModalOpen(false);
      setPinValue('');
      setConfirmPinValue('');
      setPinError('');
      setPinMode('set');
      void dispatch(fetchWalletsThunk());
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to set PIN.');
      if (msg.toLowerCase().includes('already set')) {
        setPinMode('verify');
        setPinError('');
      } else {
        setPinError(msg);
      }
    } finally {
      setSettingPin(false);
    }
  };

  const handleVerifyPin = async () => {
    if (pinValue.length !== 4) return;

    setSettingPin(true);
    setPinError('');

    try {
      await dispatch(verifyWalletPinThunk({ authKey: pinValue })).unwrap();
      dispatch(pushNotification({ type: 'success', title: 'PIN verified', message: 'Your wallet PIN has been verified successfully.' }));
      setIsPinModalOpen(false);
      setPinValue('');
      setConfirmPinValue('');
      setPinError('');
      setPinMode('set');
      void dispatch(fetchWalletsThunk());
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to verify PIN.');
      setPinError(msg);
    } finally {
      setSettingPin(false);
    }
  };

  const closePinModal = () => {
    setIsPinModalOpen(false);
    setPinValue('');
    setConfirmPinValue('');
    setPinError('');
    setPinMode('set');
  };

  const handleCreateWallet = async () => {
    dispatch(clearCreateWalletStatus());

    try {
      const response = await dispatch(createWalletThunk({ currency: selectedCurrency })).unwrap();
      dispatch(
        pushNotification({
          type: 'success',
          title: 'Wallet created',
          message: response.message || 'Your wallet has been created successfully.',
        }),
      );
      dispatch(fetchWalletsThunk());
    } catch (requestError) {
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Unable to create wallet',
          message: getErrorMessage(requestError, 'Unable to create wallet.'),
        }),
      );
    }
  };

  const handleFundWallet = async () => {
    if (!fundingWallet?.walletNumber) {
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Unable to fund wallet',
          message: 'Wallet number is required to initiate funding.',
        }),
      );
      return;
    }

    if (fundingAmountMajor <= 0) return;

    try {
      await dispatch(
        fundWalletThunk({
          walletNumber: fundingWallet.walletNumber,
          payload: {
            amount: fundingAmountMinor,
            paymentMethod: 'paystack',
            currency: fundingWallet.currency,
            callbackUrl: callbackUrls.walletFunding(),
          },
        }),
      ).unwrap();
    } catch {
      // The slice keeps the modal-level error visible for retry.
    }
  };

  const continueToCheckout = () => {
    const checkoutUrl = fundingResult?.data.checkoutUrl;

    if (!checkoutUrl) {
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Checkout unavailable',
          message: 'The payment gateway did not return a checkout URL.',
        }),
      );
      return;
    }

    window.location.assign(checkoutUrl);
  };

  if (loading && !lastFetchedAt) {
    return (
      <AppShell>
        <main className="grid min-h-[65vh] place-items-center px-4">
          <AppLoader label="Loading wallet" />
        </main>
      </AppShell>
    );
  }

  if (error && !lastFetchedAt) {
    return (
      <AppShell>
        <main className="grid min-h-[65vh] place-items-center px-4">
          <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
              <AlertCircle className="size-6" aria-hidden />
            </span>
            <div className="grid gap-1">
              <AppText variant="h5" color="#991B1B" align="center">
                Unable to load wallet
              </AppText>
              <AppText variant="bodySmall" color="#B91C1C" align="center">
                {error}
              </AppText>
            </div>
            <AppButton leftIcon={<RefreshCw className="size-4" aria-hidden />} loading={loading} onClick={retryWallets}>
              Retry
            </AppButton>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto grid w-full max-w-[78rem] gap-5 px-4 py-6 pb-28 sm:px-6 md:px-9 md:py-9">
        {items.length === 0 ? (
          <section className="grid min-h-[50vh] place-items-center">
            <div className="grid w-full max-w-md justify-items-center gap-5 rounded-xl border border-[#E5E7EB] bg-white p-5 text-center shadow-[0_12px_28px_rgba(11,31,74,0.08)] sm:p-6">
              <span className="grid size-14 place-items-center rounded-xl bg-[#EAF1FF] text-[#123B8D]">
                <CreditCard className="size-7" aria-hidden />
              </span>
              <div className="grid gap-2">
                <AppText variant="h4" align="center">
                  No wallet yet
                </AppText>
                <AppText variant="bodyMedium" color="textSecondary" align="center">
                  Create a wallet to start managing giving, balance, and wallet activity.
                </AppText>
              </div>

              <div className="grid w-full gap-3">
                <AppDropdown
                  label="Currency"
                  options={currencyOptions}
                  value={selectedCurrency}
                  onChange={(nextValue) =>
                    dispatch(setWalletCurrency((Array.isArray(nextValue) ? nextValue[0] : nextValue) as WalletCreateCurrency))
                  }
                />
                {createError && (
                  <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
                    {createError}
                  </div>
                )}
                {createSuccessMessage && (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                    {createSuccessMessage}
                  </div>
                )}
                <AppButton
                  fullWidth
                  leftIcon={<Plus className="size-4" aria-hidden />}
                  loading={createLoading}
                  onClick={handleCreateWallet}
                >
                  Create wallet
                </AppButton>
              </div>
            </div>
          </section>
        ) : (
          <div className="grid gap-5">
            {primaryWallet && (
              <WalletSummary
                wallet={primaryWallet}
                featured
                onFundWallet={openFundingModal}
                onViewTransactions={openTransactionsPage}
                onSetPin={openPinModal}
              />
            )}

            {otherWallets.length > 0 && (
              <section className="grid gap-3">
                <AppText variant="h5">Other Wallets</AppText>
                <div className="grid gap-4 lg:grid-cols-2">
                  {otherWallets.map((wallet) => (
                    <WalletSummary
                      wallet={wallet}
                      key={wallet.id}
                      onFundWallet={openFundingModal}
                      onViewTransactions={openTransactionsPage}
                      onSetPin={openPinModal}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      <AppModal
        open={Boolean(fundingWallet)}
        title={fundingResult ? 'Review funding' : 'Fund wallet'}
        onClose={closeFundingModal}
        footer={
          fundingResult ? (
            <>
              <AppButton variant="secondary" onClick={closeFundingModal}>
                Cancel
              </AppButton>
              <AppButton rightIcon={<ExternalLink className="size-4" aria-hidden />} onClick={continueToCheckout}>
                Proceed
              </AppButton>
            </>
          ) : (
            <>
              <AppButton variant="secondary" onClick={closeFundingModal}>
                Cancel
              </AppButton>
              <AppButton loading={fundingLoading} disabled={!canSubmitFunding} onClick={handleFundWallet}>
                Proceed
              </AppButton>
            </>
          )
        }
      >
        {fundingWallet && (
          <div className="grid gap-4">
            {fundingResult && fundingTransaction ? (
              <>
                <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-900">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-emerald-700">
                    <CheckCircle2 className="size-5" aria-hidden />
                  </span>
                  <div className="grid gap-1">
                    <AppText variant="h5" color="#065F46">
                      Wallet funding initiated
                    </AppText>
                    <AppText variant="bodySmall" color="#047857">
                      Review the transaction details before continuing to payment.
                    </AppText>
                  </div>
                </div>

                <div className="grid rounded-xl border border-[#E5E7EB] px-4">
                  <FundingDetailRow
                    label="Funding amount"
                    value={formatMinorMoney(fundingResult.data.fundingAmount, fundingTransaction.currency)}
                  />
                  <FundingDetailRow
                    label="Total amount"
                    value={formatMinorMoney(fundingTransaction.amountTotal, fundingTransaction.currency)}
                  />
                  <FundingDetailRow
                    label="Fees"
                    value={formatMinorMoney(fundingTransaction.feesAmountTotal, fundingTransaction.currency)}
                  />
                  <FundingDetailRow label="Payment method" value={fundingTransaction.paymentMethod} />
                  <FundingDetailRow label="Status" value={fundingTransaction.status} />
                </div>

                {fundingFees.length > 0 && (
                  <div className="grid gap-2">
                    <AppText variant="caption" color="textMuted" weight="bold">
                      Fee details
                    </AppText>
                    {fundingFees.map((fee) => (
                      <div className="rounded-lg border border-[#E5E7EB] p-3" key={`${fee.name}-${fee.type}`}>
                        <AppText variant="bodySmall" weight="bold">
                          {fee.name}: {formatMinorMoney(fee.amountTotal, fundingTransaction.currency)}
                        </AppText>
                        {fee.description && (
                          <AppText variant="caption" color="textSecondary">
                            {fee.description}
                          </AppText>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                  <AppText variant="caption" color="textMuted" weight="bold">
                    Funding wallet
                  </AppText>
                  <AppText variant="h5">{fundingWallet.displayName || `${fundingWallet.currency} Wallet`}</AppText>
                  <AppText variant="bodySmall" color="textSecondary">
                    Wallet No. {fundingWallet.walletNumber || 'Not provided'}
                  </AppText>
                </div>

                <AppMoneyInput
                  currency={fundingWallet.currency}
                  disabled={fundingLoading}
                  error={fundingError ?? undefined}
                  value={fundingAmount}
                  onChange={setFundingAmount}
                />
              </>
            )}
          </div>
        )}
      </AppModal>

      <AppModal
        open={isPinModalOpen}
        title={pinMode === 'verify' ? 'Verify Wallet PIN' : 'Set Wallet PIN'}
        onClose={closePinModal}
        footer={
          <>
            <AppButton variant="secondary" onClick={closePinModal}>
              Cancel
            </AppButton>
            {pinMode === 'verify' ? (
              <AppButton
                variant="primary"
                loading={settingPin}
                disabled={pinValue.length !== 4}
                onClick={() => void handleVerifyPin()}
              >
                Verify PIN
              </AppButton>
            ) : (
              <AppButton
                variant="primary"
                loading={settingPin}
                disabled={!canSetPin}
                onClick={() => void handleSetPin()}
              >
                Set PIN
              </AppButton>
            )}
          </>
        }
      >
        <div className="grid gap-4">
          <AppText variant="bodyMedium" color="textSecondary">
            {pinMode === 'verify'
              ? 'Enter your existing 4-digit PIN to verify your identity.'
              : 'Create a 4-digit PIN to secure your wallet transactions.'}
          </AppText>
          {pinError && (
            <AppText variant="bodySmall" color="#B91C1C">
              {pinError}
            </AppText>
          )}
          <AppInput
            label="Enter PIN"
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="4-digit PIN"
            value={pinValue}
            onChange={(e) => handlePinChange(e.target.value)}
          />
          {pinMode === 'set' && (
            <AppInput
              label="Confirm PIN"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Confirm PIN"
              value={confirmPinValue}
              onChange={(e) => handleConfirmPinChange(e.target.value)}
            />
          )}
        </div>
      </AppModal>
    </AppShell>
  );
}
