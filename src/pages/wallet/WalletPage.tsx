import { useCallback, useEffect, type ReactNode } from 'react';
import { AlertCircle, ArrowDownLeft, ArrowUpRight, CreditCard, Plus, RefreshCw, Wallet as WalletIcon } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppLoader } from '@/components/feedback';
import { AppDropdown } from '@/components/form';
import { AppShell } from '@/layouts/AppShell';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCreateWalletStatus, clearWalletError, setWalletCurrency } from '@/store/slices/walletSlice';
import { pushNotification } from '@/store/slices/notificationSlice';
import { createWalletThunk, fetchWalletsThunk } from '@/store/thunks/walletThunk';
import type { Wallet, WalletCreateCurrency } from '@/types/wallet';

const currencyOptions: Array<{ label: string; value: WalletCreateCurrency }> = [
  { label: 'NGN', value: 'NGN' },
  { label: 'USD', value: 'USD' },
];

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

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  return fallback;
};

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

const WalletSummary = ({ wallet, featured = false }: { wallet: Wallet; featured?: boolean }) => (
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
      <span className="rounded-full border border-[#D6DEEB] bg-[#F8FAFC] px-3 py-1 text-xs font-black uppercase text-[#123B8D]">
        {wallet.status || 'active'}
      </span>
    </div>

    <div className="grid gap-1 rounded-xl bg-[#0B1F4A] p-4 text-white">
      <AppText variant="caption" color="#D8E4FF" weight="bold">
        Available Balance
      </AppText>
      <AppText variant={featured ? 'displaySmall' : 'h3'} color="textInverse">
        {formatMoney(wallet.balance, wallet.currency)}
      </AppText>
      <AppText variant="bodySmall" color="#D8E4FF">
        {wallet.currency} wallet
      </AppText>
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
      <WalletMetric
        icon={<ArrowUpRight className="size-4" aria-hidden />}
        label="Total Credit"
        value={formatMoney(wallet.totalCredit, wallet.currency)}
      />
      <WalletMetric
        icon={<ArrowDownLeft className="size-4" aria-hidden />}
        label="Total Debit"
        value={formatMoney(wallet.totalDebit, wallet.currency)}
      />
    </div>
  </section>
);

export default function WalletPage() {
  const dispatch = useAppDispatch();
  const {
    createError,
    createLoading,
    createSuccessMessage,
    error,
    items,
    lastFetchedAt,
    loading,
    selectedCurrency,
  } = useAppSelector((state) => state.wallet);
  const primaryWallet = items[0] ?? null;
  const otherWallets = items.slice(1);

  useEffect(() => {
    if (lastFetchedAt || loading) return;
    dispatch(fetchWalletsThunk());
  }, [dispatch, lastFetchedAt, loading]);

  const retryWallets = useCallback(() => {
    dispatch(clearWalletError());
    dispatch(fetchWalletsThunk());
  }, [dispatch]);

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
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1">
            <AppText variant="h3">Wallet</AppText>
            <AppText variant="bodyMedium" color="textSecondary">
              Manage your BaptistOne wallet balance.
            </AppText>
          </div>
          <AppButton
            leftIcon={<RefreshCw className="size-4" aria-hidden />}
            loading={loading}
            variant="outline"
            onClick={retryWallets}
          >
            Refresh
          </AppButton>
        </header>

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
            {primaryWallet && <WalletSummary wallet={primaryWallet} featured />}

            {otherWallets.length > 0 && (
              <section className="grid gap-3">
                <AppText variant="h5">Other Wallets</AppText>
                <div className="grid gap-4 lg:grid-cols-2">
                  {otherWallets.map((wallet) => (
                    <WalletSummary wallet={wallet} key={wallet.id} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}
