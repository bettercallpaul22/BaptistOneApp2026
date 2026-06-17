import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Church,
  CreditCard,
  ExternalLink,
  Gift,
  RefreshCw,
  Wallet as WalletIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppLoader, AppModal } from '@/components/feedback';
import { AppInput, AppMoneyInput } from '@/components/form';
import { callbackUrls } from '@/constants/callbackUrls';
import { AppShell } from '@/layouts/AppShell';
import { paths } from '@/routes/paths';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearMemberError } from '@/store/slices/memberSlice';
import { clearWalletError } from '@/store/slices/walletSlice';
import { clearGivingConfigStatus, clearGivingPaymentStatus } from '@/store/slices/givingSlice';
import { pushNotification } from '@/store/slices/notificationSlice';
import { fetchGivingConfigThunk, createGivingThunk } from '@/store/thunks/givingThunk';
import { fetchMemberAccountThunk } from '@/store/thunks/memberThunk';
import { fetchWalletsThunk, setWalletPinThunk, verifyWalletPinThunk } from '@/store/thunks/walletThunk';
import type { GivingBucket } from '@/types/giving';
import type { MemberAccount } from '@/types/member';

const minorUnitMultiplier = 100;

const getChurchId = (memberAccount: MemberAccount | null) =>
  memberAccount?.membershipAndPreferences?.churchId || memberAccount?.basicProfile?.churchId || null;

const getMemberId = (memberAccount: MemberAccount | null) => memberAccount?.basicProfile?.id || null;

const toMinorCurrencyUnit = (amount: number) => Math.round(amount * minorUnitMultiplier);

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
};

const formatMinorMoney = (value: number, currency: string) => formatMoney(value / minorUnitMultiplier, currency);

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  return fallback;
};

const GivingStateMessage = ({
  action,
  description,
  icon,
  tone = 'default',
  title,
}: {
  action?: ReactNode;
  description: string;
  icon: ReactNode;
  tone?: 'default' | 'error';
  title: string;
}) => (
  <section className="grid min-h-[55vh] place-items-center px-2">
    <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
      <span
        className={clsx(
          'grid size-14 place-items-center rounded-full',
          tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-[#EAF1FF] text-[#123B8D]',
        )}
      >
        {icon}
      </span>
      <div className="grid gap-1">
        <AppText variant="h5" color={tone === 'error' ? '#991B1B' : 'textPrimary'} align="center">
          {title}
        </AppText>
        <AppText variant="bodyMedium" color={tone === 'error' ? '#B91C1C' : 'textSecondary'} align="center">
          {description}
        </AppText>
      </div>
      {action}
    </div>
  </section>
);

const BucketCard = ({
  bucket,
  selected,
  onSelect,
}: {
  bucket: GivingBucket;
  selected: boolean;
  onSelect: () => void;
}) => (
  <button
    className={clsx(
      'grid min-h-28 gap-3 rounded-xl border p-4 text-left transition',
      selected
        ? 'border-[#123B8D] bg-[#EAF1FF] shadow-[0_12px_24px_rgba(18,59,141,0.14)]'
        : 'border-[#D6DEEB] bg-white shadow-[0_8px_18px_rgba(11,31,74,0.06)] hover:border-[#123B8D]',
    )}
    type="button"
    onClick={onSelect}
  >
    <div className="flex items-start justify-between gap-3">
      <span className="grid size-10 place-items-center rounded-xl bg-white text-[#123B8D]">
        <Gift className="size-5" aria-hidden />
      </span>
      {bucket.isDefault && (
        <span className="rounded-full bg-[#D4A017]/15 px-2.5 py-1 text-[10px] font-black uppercase text-[#8A6500]">
          Default
        </span>
      )}
    </div>
    <div className="grid gap-1">
      <AppText variant="subtitle">{bucket.name}</AppText>
      <AppText variant="caption" color="textMuted" weight="bold">
        {bucket.code}
      </AppText>
    </div>
  </button>
);

export default function GivingPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const memberAccount = useAppSelector((state) => state.member.data);
  const memberLoading = useAppSelector((state) => state.member.loading);
  const memberError = useAppSelector((state) => state.member.error);
  const memberLastFetchedAt = useAppSelector((state) => state.member.lastFetchedAt);
  const {
    error: walletError,
    items: wallets,
    lastFetchedAt: walletsLastFetchedAt,
    loading: walletsLoading,
  } = useAppSelector((state) => state.wallet);
  const {
    config,
    configChurchId,
    configError,
    configLastFetchedAt,
    configLoading,
    paymentError,
    paymentLoading,
    paymentResult,
  } = useAppSelector((state) => state.giving);
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [confirmPinValue, setConfirmPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [settingPin, setSettingPin] = useState(false);
  const [pinMode, setPinMode] = useState<'set' | 'verify'>('set');
  const [walletPin, setWalletPin] = useState('');
  const pendingGivingRef = useRef<(() => void) | null>(null);
  const churchId = getChurchId(memberAccount);
  const memberId = getMemberId(memberAccount);
  const supportedCurrencies = useMemo(
    () => new Set((config?.supportedCurrencies ?? []).map((currency) => currency.toUpperCase())),
    [config?.supportedCurrencies],
  );
  const configuredCurrencies = useMemo(
    () => new Set((config?.configuredCurrencies ?? []).map((currency) => currency.toUpperCase())),
    [config?.configuredCurrencies],
  );
  const selectedWallet = useMemo(() => {
    if (!config || supportedCurrencies.size === 0) return null;

    const primaryWallet = wallets[0];
    if (primaryWallet && supportedCurrencies.has(primaryWallet.currency.toUpperCase())) {
      return primaryWallet;
    }

    return wallets.find((wallet) => supportedCurrencies.has(wallet.currency.toUpperCase())) ?? null;
  }, [config, supportedCurrencies, wallets]);
  const selectedCurrency = selectedWallet?.currency ?? config?.supportedCurrencies[0] ?? config?.configuredCurrencies[0] ?? 'NGN';
  const receivingWalletIds = useMemo(() => {
    if (!config || !selectedWallet) return new Set<string>();

    return new Set(
      config.wallets
        .filter((wallet) => wallet.currency.toUpperCase() === selectedWallet.currency.toUpperCase())
        .map((wallet) => wallet.id),
    );
  }, [config, selectedWallet]);
  const activeBuckets = useMemo(() => {
    const buckets = (config?.buckets ?? []).filter((bucket) => bucket.isActive);

    if (receivingWalletIds.size === 0) return buckets;

    return buckets.filter((bucket) => receivingWalletIds.has(bucket.walletId));
  }, [config?.buckets, receivingWalletIds]);
  const hasConfiguredGiving = Boolean(config && (config.buckets.length > 0 || config.wallets.length > 0 || config.supportedCurrencies.length > 0));
  const hasCompatibleConfiguredCurrency = wallets.some((wallet) => configuredCurrencies.has(wallet.currency.toUpperCase()));
  const defaultBucket = activeBuckets.find((bucket) => bucket.isDefault) ?? activeBuckets[0] ?? null;
  const selectedBucket = activeBuckets.find((bucket) => bucket.id === selectedBucketId) ?? defaultBucket;
  const amountMajor = Number(amount || 0);
  const amountMinor = toMinorCurrencyUnit(amountMajor);
  const minAmount = config?.minAmount ?? null;
  const maxAmount = config?.maxAmount ?? null;
  const amountError =
    amount && minAmount !== null && amountMinor < minAmount
      ? `Minimum amount is ${formatMinorMoney(minAmount, selectedCurrency)}.`
      : amount && maxAmount !== null && amountMinor > maxAmount
        ? `Maximum amount is ${formatMinorMoney(maxAmount, selectedCurrency)}.`
        : undefined;
  const canSubmit = Boolean(churchId && memberId && selectedWallet && selectedBucket && amountMajor > 0 && !amountError && !paymentLoading);
  const walletInsufficientBalance = Boolean(selectedWallet && amountMinor > selectedWallet.balance);
  const canSubmitWallet = canSubmit && !walletInsufficientBalance && walletPin.length === 4;
  const transaction = paymentResult?.data.transaction;
  const givingAmount = paymentResult?.data.givingAmount ?? paymentResult?.data.amount ?? amountMinor;

  useEffect(() => {
    if (!memberLastFetchedAt && !memberLoading) {
      dispatch(fetchMemberAccountThunk());
    }
  }, [dispatch, memberLastFetchedAt, memberLoading]);

  useEffect(() => {
    if (!walletsLastFetchedAt && !walletsLoading) {
      dispatch(fetchWalletsThunk());
    }
  }, [dispatch, walletsLastFetchedAt, walletsLoading]);

  useEffect(() => {
    if (!churchId || !walletsLastFetchedAt) return;
    if (configChurchId === churchId && configLastFetchedAt) return;

    dispatch(fetchGivingConfigThunk(churchId));
  }, [churchId, configChurchId, configLastFetchedAt, dispatch, walletsLastFetchedAt]);

  const retry = useCallback(() => {
    if (!memberLastFetchedAt || memberError) {
      dispatch(clearMemberError());
      dispatch(fetchMemberAccountThunk());
    }

    if (!walletsLastFetchedAt || walletError) {
      dispatch(clearWalletError());
      dispatch(fetchWalletsThunk());
    }

    if (churchId) {
      dispatch(clearGivingConfigStatus());
      dispatch(fetchGivingConfigThunk(churchId));
    }
  }, [churchId, dispatch, memberError, memberLastFetchedAt, walletError, walletsLastFetchedAt]);

  const handleSubmit = async (method: 'wallet' | 'paystack') => {
    if (!churchId || !memberId || !selectedWallet || !selectedBucket) return;
    if (amountMajor <= 0 || amountError) return;
    if (method === 'wallet' && walletInsufficientBalance) return;
    if (method === 'wallet' && walletPin.length !== 4) return;

    dispatch(clearGivingPaymentStatus());

    try {
      const result = await dispatch(
        createGivingThunk({
          churchId,
          amount: amountMinor,
          currency: selectedWallet.currency,
          type: selectedBucket.code,
          paymentMethod: method,
          bucketId: selectedBucket.id,
          memberId,
          callbackUrl: method === 'paystack' ? callbackUrls.giving() : '',
          ...(note.trim() ? { note: note.trim() } : {}),
          ...(method === 'wallet' ? { authKey: walletPin } : {}),
        }),
      ).unwrap();

      if (method === 'wallet') {
        dispatch(
          pushNotification({
            type: 'success',
            title: 'Giving successful',
            message: `Your gift of ${formatMinorMoney(amountMinor, selectedWallet.currency)} has been processed from your wallet.`,
          }),
        );
        setAmount('');
        setNote('');
        setWalletPin('');
        void dispatch(fetchWalletsThunk());
      } else if (result.data.checkoutUrl) {
        window.location.assign(result.data.checkoutUrl);
      }
    } catch (requestError) {
      const errorMessage = getErrorMessage(requestError, 'Unable to initiate giving payment.');

      if (errorMessage.toLowerCase().includes('authkey')) {
        pendingGivingRef.current = () => void handleSubmit(method);
        setIsPinModalOpen(true);
        return;
      }

      dispatch(
        pushNotification({
          type: 'error',
          title: 'Unable to start giving',
          message: errorMessage,
        }),
      );
    }
  };

  const closeReview = () => {
    dispatch(clearGivingPaymentStatus());
  };

  const continueToCheckout = () => {
    const checkoutUrl = paymentResult?.data.checkoutUrl;

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
      if (pendingGivingRef.current) {
        pendingGivingRef.current();
        pendingGivingRef.current = null;
      }
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
      if (pendingGivingRef.current) {
        pendingGivingRef.current();
        pendingGivingRef.current = null;
      }
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
    pendingGivingRef.current = null;
  };

  if ((memberLoading && !memberLastFetchedAt) || (walletsLoading && !walletsLastFetchedAt)) {
    return (
      <AppShell>
        <main className="grid min-h-[65vh] place-items-center px-4">
          <AppLoader label="Loading giving" />
        </main>
      </AppShell>
    );
  }

  if (memberError && !memberLastFetchedAt) {
    return (
      <AppShell>
        <main className="mx-auto grid w-full max-w-[78rem] px-4 py-6 pb-28 sm:px-6 md:px-9">
          <GivingStateMessage
            title="Unable to load member"
            description={memberError}
            tone="error"
            icon={<AlertCircle className="size-7" aria-hidden />}
            action={<AppButton leftIcon={<RefreshCw className="size-4" aria-hidden />} loading={memberLoading} onClick={retry}>Retry</AppButton>}
          />
        </main>
      </AppShell>
    );
  }

  if (!churchId || !memberId) {
    return (
      <AppShell>
        <main className="mx-auto grid w-full max-w-[78rem] px-4 py-6 pb-28 sm:px-6 md:px-9">
          <GivingStateMessage
            title="Join a church to give"
            description="Connect your profile to a church before giving."
            icon={<Church className="size-7" aria-hidden />}
            action={<AppButton onClick={() => navigate(paths.profile, { state: { profileTab: 'church' } })}>Join church</AppButton>}
          />
        </main>
      </AppShell>
    );
  }

  if (walletError && !walletsLastFetchedAt) {
    return (
      <AppShell>
        <main className="mx-auto grid w-full max-w-[78rem] px-4 py-6 pb-28 sm:px-6 md:px-9">
          <GivingStateMessage
            title="Unable to load wallet"
            description={walletError}
            tone="error"
            icon={<AlertCircle className="size-7" aria-hidden />}
            action={<AppButton leftIcon={<RefreshCw className="size-4" aria-hidden />} loading={walletsLoading} onClick={retry}>Retry</AppButton>}
          />
        </main>
      </AppShell>
    );
  }

  if (!wallets.length) {
    return (
      <AppShell>
        <main className="mx-auto grid w-full max-w-[78rem] px-4 py-6 pb-28 sm:px-6 md:px-9">
          <GivingStateMessage
            title="Create a wallet first"
            description="You need a BaptistOne wallet before making a gift."
            icon={<CreditCard className="size-7" aria-hidden />}
            action={<AppButton onClick={() => navigate(paths.wallet)}>Create wallet</AppButton>}
          />
        </main>
      </AppShell>
    );
  }

  if (configLoading && (!config || configChurchId !== churchId)) {
    return (
      <AppShell>
        <main className="grid min-h-[65vh] place-items-center px-4">
          <AppLoader label="Loading giving options" />
        </main>
      </AppShell>
    );
  }

  if (configError && (!config || configChurchId !== churchId)) {
    return (
      <AppShell>
        <main className="mx-auto grid w-full max-w-[78rem] px-4 py-6 pb-28 sm:px-6 md:px-9">
          <GivingStateMessage
            title="Unable to load giving options"
            description={configError}
            tone="error"
            icon={<AlertCircle className="size-7" aria-hidden />}
            action={<AppButton leftIcon={<RefreshCw className="size-4" aria-hidden />} loading={configLoading} onClick={retry}>Retry</AppButton>}
          />
        </main>
      </AppShell>
    );
  }

  if (!hasConfiguredGiving) {
    return (
      <AppShell>
        <main className="mx-auto grid w-full max-w-[78rem] px-4 py-6 pb-28 sm:px-6 md:px-9">
          <GivingStateMessage
            title="Giving not configured"
            description="This church has not enabled receiving wallets or giving buckets yet."
            icon={<Gift className="size-7" aria-hidden />}
            action={<AppButton leftIcon={<RefreshCw className="size-4" aria-hidden />} loading={configLoading} onClick={retry}>Refresh</AppButton>}
          />
        </main>
      </AppShell>
    );
  }

  if (!activeBuckets.length) {
    return (
      <AppShell>
        <main className="mx-auto grid w-full max-w-[78rem] px-4 py-6 pb-28 sm:px-6 md:px-9">
          <GivingStateMessage
            title="No giving buckets"
            description="This church has not enabled any active giving buckets for your wallet currency yet."
            icon={<Gift className="size-7" aria-hidden />}
            action={<AppButton leftIcon={<RefreshCw className="size-4" aria-hidden />} loading={configLoading} onClick={retry}>Refresh</AppButton>}
          />
        </main>
      </AppShell>
    );
  }

  if (!selectedWallet) {
    return (
      <AppShell>
        <main className="mx-auto grid w-full max-w-[78rem] px-4 py-6 pb-28 sm:px-6 md:px-9">
          <GivingStateMessage
            title="Wallet currency not supported"
            description={
              hasCompatibleConfiguredCurrency
                ? 'This church has configured your wallet currency, but it is not currently enabled for giving.'
                : `This church accepts ${config?.configuredCurrencies.join(', ') || 'configured'} giving currencies. Create or use a supported wallet to continue.`
            }
            icon={<WalletIcon className="size-7" aria-hidden />}
            action={<AppButton onClick={() => navigate(paths.wallet)}>Manage wallet</AppButton>}
          />
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto grid w-full max-w-[78rem] gap-5 px-4 py-6 pb-28 sm:px-6 md:px-9 md:py-9">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1">
            <AppText variant="h3">Giving</AppText>
            <AppText variant="bodyMedium" color="textSecondary">
              Give securely to your church.
            </AppText>
          </div>
          <AppButton
            leftIcon={<RefreshCw className="size-4" aria-hidden />}
            loading={walletsLoading || configLoading}
            variant="outline"
            onClick={retry}
          >
            Refresh
          </AppButton>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid min-w-0 gap-5">
            <section className="grid gap-3 rounded-xl border border-[#D6DEEB] bg-white p-4 shadow-[0_12px_28px_rgba(11,31,74,0.08)] sm:p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#EAF1FF] text-[#123B8D]">
                  <WalletIcon className="size-6" aria-hidden />
                </span>
                <div className="grid min-w-0 gap-1">
                  <AppText variant="h5">{selectedWallet.displayName || `${selectedWallet.currency} Wallet`}</AppText>
                  <AppText variant="bodySmall" color="textMuted">
                    Wallet No. {selectedWallet.walletNumber || 'Not provided'}
                  </AppText>
                </div>
              </div>
              <div className="grid gap-1 rounded-xl bg-[#0B1F4A] p-4 text-white">
                <AppText variant="caption" color="#D8E4FF" weight="bold">
                  Available Balance
                </AppText>
                <AppText variant="h3" color="textInverse">
                  {formatMinorMoney(selectedWallet.balance, selectedWallet.currency)}
                </AppText>
                <AppText variant="bodySmall" color="#D8E4FF">
                  {selectedWallet.currency} wallet
                </AppText>
              </div>
            </section>

            <section className="grid gap-3">
              <div className="grid gap-1">
                <AppText variant="h5">Choose giving bucket</AppText>
                <AppText variant="bodySmall" color="textSecondary">
                  Select where this gift should be received.
                </AppText>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {activeBuckets.map((bucket) => (
                  <BucketCard
                    bucket={bucket}
                    key={bucket.id}
                    selected={bucket.id === selectedBucket?.id}
                    onSelect={() => {
                      dispatch(clearGivingPaymentStatus());
                      setSelectedBucketId(bucket.id);
                    }}
                  />
                ))}
              </div>
            </section>
          </div>

          <aside className="grid content-start gap-5">
            <section className="grid gap-4 rounded-xl border border-[#D6DEEB] bg-white p-4 shadow-[0_12px_28px_rgba(11,31,74,0.08)] sm:p-5">
              <div className="grid gap-1">
                <AppText variant="h5">Gift amount</AppText>
                {selectedBucket && (
                  <AppText variant="bodySmall" color="textSecondary">
                    Giving to {selectedBucket.name}
                  </AppText>
                )}
              </div>
              <AppMoneyInput
                currency={selectedCurrency}
                disabled={paymentLoading}
                error={amountError ?? paymentError ?? undefined}
                presets={['1000', '5000', '10000']}
                value={amount}
                onChange={(value) => {
                  dispatch(clearGivingPaymentStatus());
                  setAmount(value);
                }}
              />
              {walletInsufficientBalance && amountMajor > 0 && (
                <AppText variant="caption" color="#B91C1C">
                  Insufficient wallet balance. Your balance is {formatMinorMoney(selectedWallet?.balance ?? 0, selectedCurrency)}.
                </AppText>
              )}
              <label className="grid gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">Note</span>
                <textarea
                  className="min-h-24 resize-none rounded-xl border border-[#D6DEEB] bg-[#F8FAFC] p-3 text-sm font-semibold text-[#0B1F4A] outline-none transition placeholder:text-[#A8B3C4] focus:border-[#123B8D] focus:ring-3 focus:ring-[#123B8D]/10"
                  disabled={paymentLoading}
                  maxLength={240}
                  placeholder="Optional note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>
              <AppInput
                label="Wallet PIN"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="4-digit PIN"
                disabled={paymentLoading}
                value={walletPin}
                onChange={(e) => {
                  const numeric = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                  setWalletPin(numeric);
                }}
              />
              <div className="grid grid-cols-2 gap-3">
                <AppButton
                  fullWidth
                  variant="secondary"
                  loading={paymentLoading}
                  disabled={!canSubmitWallet}
                  onClick={() => void handleSubmit('wallet')}
                >
                  Give via Wallet
                </AppButton>
                <AppButton
                  fullWidth
                  loading={paymentLoading}
                  disabled={!canSubmit}
                  onClick={() => void handleSubmit('paystack')}
                >
                  Pay with Bank
                </AppButton>
              </div>
            </section>
          </aside>
        </section>
      </main>

      <AppModal
        open={Boolean(paymentResult && transaction)}
        title="Review giving"
        onClose={closeReview}
        footer={
          <>
            <AppButton variant="secondary" onClick={closeReview}>
              Cancel
            </AppButton>
            <AppButton rightIcon={<ExternalLink className="size-4" aria-hidden />} onClick={continueToCheckout}>
              Proceed
            </AppButton>
          </>
        }
      >
        {transaction && selectedBucket && (
          <div className="grid gap-4">
            <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-900">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-emerald-700">
                <CheckCircle2 className="size-5" aria-hidden />
              </span>
              <div className="grid gap-1">
                <AppText variant="h5" color="#065F46">
                  Giving payment initiated
                </AppText>
                <AppText variant="bodySmall" color="#047857">
                  Review the details before continuing to payment.
                </AppText>
              </div>
            </div>
            <div className="grid gap-2 rounded-xl border border-[#E5E7EB] p-4">
              <div className="flex items-center justify-between gap-3 border-b border-[#EEF2F7] pb-3">
                <AppText variant="caption" color="textMuted" weight="bold">
                  Bucket
                </AppText>
                <AppText variant="bodySmall" weight="bold">
                  {selectedBucket.name}
                </AppText>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-[#EEF2F7] pb-3">
                <AppText variant="caption" color="textMuted" weight="bold">
                  Gift amount
                </AppText>
                <AppText variant="bodySmall" weight="bold">
                  {formatMinorMoney(givingAmount, transaction.currency)}
                </AppText>
              </div>
              <div className="flex items-center justify-between gap-3">
                <AppText variant="caption" color="textMuted" weight="bold">
                  Total
                </AppText>
                <AppText variant="bodySmall" weight="bold">
                  {formatMinorMoney(transaction.amountTotal, transaction.currency)}
                </AppText>
              </div>
            </div>
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
