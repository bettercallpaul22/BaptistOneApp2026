import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Church,
  CreditCard,
  ExternalLink,
  Gift,
  Heart,
  KeyRound,
  MoreVertical,
  RefreshCw,
  Wallet as WalletIcon,
  Landmark,
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppLoader, AppModal } from '@/components/feedback';
import { AppDropdown, AppInput, AppMoneyInput } from '@/components/form';
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
const paystackFeeRate = 0.015;
const paystackFixedFee = 100;
const paystackFeeCap = 2000;

const BUCKET_GRADIENTS = [
  'from-[#123B8D] to-[#0B1F4A]',
  'from-[#059669] to-[#047857]',
  'from-[#7C3AED] to-[#5B21B6]',
  'from-[#D4A017] to-[#B8860B]',
  'from-[#DC2626] to-[#991B1B]',
  'from-[#0891B2] to-[#0E7490]',
];

const BUCKET_ICONS = [Gift, Heart, Church, CreditCard, Gift, Heart];

const getChurchId = (memberAccount: MemberAccount | null) =>
  memberAccount?.membershipAndPreferences?.churchId || memberAccount?.basicProfile?.churchId || null;

const getMemberId = (memberAccount: MemberAccount | null) => memberAccount?.basicProfile?.id || null;

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
};

const calculatePaystackFee = (amount: number) =>
  Math.min(Math.round((amount * paystackFeeRate) + paystackFixedFee), paystackFeeCap);

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
  index,
  selected,
  onSelect,
}: {
  bucket: GivingBucket;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) => {
  const gradient = BUCKET_GRADIENTS[index % BUCKET_GRADIENTS.length];
  const Icon = BUCKET_ICONS[index % BUCKET_ICONS.length];

  return (
    <button
      className={clsx(
        'group relative flex w-40 shrink-0 flex-col justify-between overflow-hidden rounded-2xl p-4 text-left text-white shadow-lg transition-all duration-300 sm:w-44',
        selected
          ? 'ring-2 ring-white ring-offset-2 ring-offset-[#F8FAFC] shadow-xl'
          : 'hover:shadow-xl',
      )}
      style={{ minHeight: '160px' }}
      type="button"
      onClick={onSelect}
    >
      <div className={clsx('absolute inset-0 bg-gradient-to-br', gradient)} aria-hidden />
      <div className="absolute -right-4 -bottom-4 opacity-10 transition-transform duration-300 group-hover:scale-110" aria-hidden>
        <Icon className="size-20" />
      </div>
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <AppText variant="h5" color="textInverse" weight="bold" className="line-clamp-2 flex-1">
            {bucket.name}
          </AppText>
          <span
            className={clsx(
              'ml-2 mt-0.5 size-5 shrink-0 rounded-full border-2 transition-all duration-200',
              selected
                ? 'border-[#123B8D] bg-[#123B8D]'
                : 'border-white/50 bg-transparent',
            )}
          >
            {selected && (
              <span className="flex size-full items-center justify-center">
                <span className="size-2 rounded-full bg-[#D4A017]" />
              </span>
            )}
          </span>
        </div>
        {bucket.isDefault && (
          <span className="mt-2 inline-block w-fit rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase backdrop-blur-sm">
            Default
          </span>
        )}
        <div className="relative z-10">
          <Icon className="size-8 text-white/80" aria-hidden />
        </div>
      </div>
    </button>
  );
};

type PaymentMethod = 'wallet' | 'bank';

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [walletPin, setWalletPin] = useState('');
  const [isConfirmSheetOpen, setIsConfirmSheetOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [confirmPinValue, setConfirmPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [settingPin, setSettingPin] = useState(false);
  const [pinMode, setPinMode] = useState<'set' | 'verify'>('set');
  const pendingGivingRef = useRef<(() => void) | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
  const minAmount = config?.minAmount ?? null;
  const maxAmount = config?.maxAmount ?? null;
  const amountError =
    amount && minAmount !== null && (amountMajor * minorUnitMultiplier) < minAmount
      ? `Minimum amount is ${formatMoney(minAmount / minorUnitMultiplier, selectedCurrency)}.`
      : amount && maxAmount !== null && (amountMajor * minorUnitMultiplier) > maxAmount
        ? `Maximum amount is ${formatMoney(maxAmount / minorUnitMultiplier, selectedCurrency)}.`
        : undefined;
  const canSubmit = Boolean(churchId && memberId && selectedWallet && selectedBucket && amountMajor > 0 && !amountError && !paymentLoading);
  const walletInsufficientBalance = Boolean(selectedWallet && (amountMajor * minorUnitMultiplier) > selectedWallet.balance);
  const canSubmitWallet = canSubmit && !walletInsufficientBalance && walletPin.length === 4;
  const paymentData = paymentResult?.data?.data;
  const transaction = paymentData?.transaction;
  const givingAmount = paymentData?.givingAmount ?? paymentData?.fundingAmount ?? paymentData?.amount ?? amountMajor;
  const paystackFee = calculatePaystackFee(givingAmount);
  const paystackTotal = givingAmount + paystackFee;

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

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

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

  const openConfirmSheet = () => {
    if (paymentMethod === 'wallet' && walletPin.length !== 4) return;
    if (!canSubmit) return;
    setIsConfirmSheetOpen(true);
  };

  const closeConfirmSheet = () => {
    setIsConfirmSheetOpen(false);
  };

  const handleSubmit = async (method: PaymentMethod) => {
    if (!churchId || !memberId || !selectedWallet || !selectedBucket) return;
    if (amountMajor <= 0 || amountError) return;
    if (method === 'wallet' && walletInsufficientBalance) return;
    if (method === 'wallet' && walletPin.length !== 4) return;

    const apiMethod = method === 'bank' ? 'paystack' : 'wallet';

    dispatch(clearGivingPaymentStatus());

    try {
      await dispatch(
        createGivingThunk({
          churchId,
          amount: amountMajor,
          currency: selectedWallet.currency,
          type: selectedBucket.code,
          paymentMethod: apiMethod,
          bucketId: selectedBucket.id,
          memberId,
          callbackUrl: method === 'bank' ? callbackUrls.giving() : '',
          ...(note.trim() ? { note: note.trim() } : {}),
          ...(method === 'wallet' ? { authKey: walletPin } : {}),
        }),
      ).unwrap();

      if (method === 'wallet') {
        dispatch(
          pushNotification({
            type: 'success',
            title: 'Giving successful',
            message: `Your gift of ${formatMoney(amountMajor, selectedWallet.currency)} has been processed from your wallet.`,
          }),
        );
        setAmount('');
        setNote('');
        setWalletPin('');
        setIsConfirmSheetOpen(false);
        void dispatch(fetchWalletsThunk());
      } else {
        setIsConfirmSheetOpen(false);
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
    const checkoutUrl = transaction?.checkoutUrl;

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
      <main className="mx-auto grid w-full max-w-[78rem] gap-6 px-4 py-6 pb-28 sm:px-6 md:px-9 md:py-9">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1">
            <AppText variant="h3">Giving</AppText>
            <AppText variant="bodyMedium" color="textSecondary">
              Give securely to your church.
            </AppText>
          </div>
          <div className="flex items-center gap-2">
            <AppButton
              leftIcon={<RefreshCw className="size-4" aria-hidden />}
              loading={walletsLoading || configLoading}
              variant="outline"
              onClick={retry}
            >
              Refresh
            </AppButton>
            <div className="relative" ref={menuRef}>
              <button
                className="flex size-9 items-center justify-center rounded-lg border border-[#D6DEEB] bg-white text-[#5A6880] transition-colors hover:bg-[#F1F5F9] hover:text-[#0B1F4A]"
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
              >
                <MoreVertical className="size-4" aria-hidden />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-[#D6DEEB] bg-white shadow-lg">
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-[#0B1F4A] transition-colors hover:bg-[#F1F5F9]"
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsPinModalOpen(true);
                    }}
                  >
                    <KeyRound className="size-4 text-[#5A6880]" aria-hidden />
                    Set Wallet PIN
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="grid gap-6">
          <section className="grid gap-3">
            <AppText variant="h5">Choose giving bucket</AppText>
            <AppDropdown
              options={activeBuckets.map((bucket) => ({
                label: `${bucket.name}${bucket.isDefault ? ' (Default)' : ''}`,
                value: bucket.id,
              }))}
              value={selectedBucket?.id}
              placeholder="Select a giving bucket"
              onChange={(value) => {
                const bucket = activeBuckets.find((b) => b.id === value);
                if (bucket) {
                  dispatch(clearGivingPaymentStatus());
                  setSelectedBucketId(bucket.id);
                }
              }}
            />
          </section>

          <section className="grid gap-4 rounded-2xl border border-[#D6DEEB] bg-white p-4 shadow-[0_8px_24px_rgba(11,31,74,0.06)] sm:p-5">
            <div className="grid gap-1">
              <AppText variant="h5">Gift details</AppText>
              {selectedBucket && (
                <AppText variant="bodySmall" color="textSecondary">
                  Giving to {selectedBucket.name}
                </AppText>
              )}
            </div>

            <div className="flex rounded-xl bg-[#F1F5F9] p-1">
              <button
                className={clsx(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200',
                  paymentMethod === 'wallet'
                    ? 'bg-[#123B8D] text-white shadow-[0_2px_8px_rgba(18,59,141,0.25)]'
                    : 'text-[#5A6880] hover:text-[#0B1F4A]',
                )}
                type="button"
                onClick={() => setPaymentMethod('wallet')}
              >
                <WalletIcon className="size-4" aria-hidden />
                Wallet
              </button>
              <button
                className={clsx(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200',
                  paymentMethod === 'bank'
                    ? 'bg-[#123B8D] text-white shadow-[0_2px_8px_rgba(18,59,141,0.25)]'
                    : 'text-[#5A6880] hover:text-[#0B1F4A]',
                )}
                type="button"
                onClick={() => setPaymentMethod('bank')}
              >
                <Landmark className="size-4" aria-hidden />
                Bank
              </button>
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

            {paymentMethod === 'wallet' && walletInsufficientBalance && amountMajor > 0 && (
              <AppText variant="caption" color="#B91C1C">
                Insufficient wallet balance. Your balance is {formatMoney(selectedWallet?.balance ?? 0, selectedCurrency)}.
              </AppText>
            )}

            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">Note</span>
              <textarea
                className="min-h-20 resize-none rounded-xl border border-[#D6DEEB] bg-[#F8FAFC] p-3 text-sm font-semibold text-[#0B1F4A] outline-none transition placeholder:text-[#A8B3C4] focus:border-[#123B8D] focus:ring-3 focus:ring-[#123B8D]/10"
                disabled={paymentLoading}
                maxLength={240}
                placeholder="Optional note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>

            {paymentMethod === 'wallet' && (
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
            )}

            <AppButton
              fullWidth
              loading={paymentLoading}
              disabled={paymentMethod === 'wallet' ? !canSubmitWallet : !canSubmit}
              onClick={paymentMethod === 'wallet' ? openConfirmSheet : () => void handleSubmit('bank')}
            >
              {paymentMethod === 'wallet' ? 'Confirm' : 'Pay with Bank'}
            </AppButton>
          </section>
        </section>
      </main>

      <AppModal
        open={isConfirmSheetOpen}
        title="Confirm Giving"
        onClose={closeConfirmSheet}
        footer={
          <>
            <AppButton variant="secondary" onClick={closeConfirmSheet}>
              Cancel
            </AppButton>
            <AppButton
              loading={paymentLoading}
              disabled={paymentLoading}
              onClick={() => void handleSubmit('wallet')}
            >
              Proceed
            </AppButton>
          </>
        }
      >
        {selectedBucket && selectedWallet && (
          <div className="grid gap-4">
            <div className="flex items-start gap-3 rounded-xl bg-[#EAF1FF] p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#123B8D] text-white">
                <CheckCircle2 className="size-5" aria-hidden />
              </span>
              <div className="grid gap-1">
                <AppText variant="h5" color="#0B1F4A">
                  Payment Summary
                </AppText>
                <AppText variant="bodySmall" color="textSecondary">
                  Review your giving details before proceeding.
                </AppText>
              </div>
            </div>

            <div className="grid gap-3 rounded-xl border border-[#E5E7EB] p-4">
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
                  Amount
                </AppText>
                <AppText variant="bodySmall" weight="bold">
                  {formatMoney(amountMajor, selectedCurrency)}
                </AppText>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-[#EEF2F7] pb-3">
                <AppText variant="caption" color="textMuted" weight="bold">
                  Payment method
                </AppText>
                <AppText variant="bodySmall" weight="bold">
                  Wallet
                </AppText>
              </div>
              <div className="flex items-center justify-between gap-3">
                <AppText variant="caption" color="textMuted" weight="bold">
                  Wallet balance after
                </AppText>
                <AppText variant="bodySmall" weight="bold">
                  {formatMoney((selectedWallet.balance / minorUnitMultiplier) - amountMajor, selectedCurrency)}
                </AppText>
              </div>
            </div>

            {note.trim() && (
              <div className="rounded-xl border border-[#E5E7EB] p-4">
                <AppText variant="caption" color="textMuted" weight="bold">
                  Note
                </AppText>
                <AppText variant="bodySmall" className="mt-1">
                  {note.trim()}
                </AppText>
              </div>
            )}
          </div>
        )}
      </AppModal>

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
                  {formatMoney(givingAmount, transaction.currency)}
                </AppText>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-[#EEF2F7] pb-3">
                <AppText variant="caption" color="textMuted" weight="bold">
                  Fees
                </AppText>
                <AppText variant="bodySmall" weight="bold">
                  {formatMoney(paystackFee, transaction.currency)}
                </AppText>
              </div>
              <div className="flex items-center justify-between gap-3">
                <AppText variant="caption" color="textMuted" weight="bold">
                  Total
                </AppText>
                <AppText variant="bodySmall" weight="bold">
                  {formatMoney(paystackTotal, transaction.currency)}
                </AppText>
              </div>
            </div>
            <div className="grid gap-2">
              <AppText variant="caption" color="textMuted" weight="bold">
                Fee details
              </AppText>
              <div className="rounded-lg border border-[#E5E7EB] p-3">
                <AppText variant="bodySmall" weight="bold">
                  Paystack Fee: {formatMoney(paystackFee, transaction.currency)}
                </AppText>
                <AppText variant="caption" color="textSecondary">
                  1.5% + {formatMoney(paystackFixedFee, transaction.currency)} (capped at {formatMoney(paystackFeeCap, transaction.currency)})
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
