import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppLoader } from '@/components/feedback';
import { AppDropdown } from '@/components/form';
import { AppShell } from '@/layouts/AppShell';
import { paths } from '@/routes/paths';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearWalletTransactionsStatus } from '@/store/slices/walletSlice';
import { fetchWalletsThunk, fetchWalletTransactionsThunk } from '@/store/thunks/walletThunk';
import type {
  Wallet,
  WalletTransactionChannel,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@/types/wallet';

const transactionTypeOptions: Array<{ label: string; value: WalletTransactionType | '' }> = [
  { label: 'All types', value: '' },
  { label: 'Credit', value: 'credit' },
  { label: 'Debit', value: 'debit' },
];

const transactionChannelOptions: Array<{ label: string; value: WalletTransactionChannel | '' }> = [
  { label: 'All channels', value: '' },
  { label: 'Dedicated NUBAN', value: 'dedicated-nuban' },
  { label: 'Purchase', value: 'purchase' },
  { label: 'Withdrawal', value: 'withdrawal' },
  { label: 'Fee', value: 'fee' },
  { label: 'Transfer', value: 'transfer' },
];

const transactionStatusOptions: Array<{ label: string; value: WalletTransactionStatus | '' }> = [
  { label: 'All statuses', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Success', value: 'success' },
  { label: 'Failed', value: 'failed' },
];

const minorUnitMultiplier = 100;
const transactionsPerPage = 10;

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

const formatMinorMoney = (value: number, currency: string) => formatMoney(value / minorUnitMultiplier, currency);

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value || 'Not provided';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatLabel = (value: string) =>
  value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getStatusClassName = (status: string) => {
  if (status === 'success') return 'border-emerald-100 bg-emerald-50 text-emerald-700';
  if (status === 'failed') return 'border-red-100 bg-red-50 text-red-700';
  if (status === 'pending') return 'border-amber-100 bg-amber-50 text-amber-700';

  return 'border-[#D6DEEB] bg-[#F8FAFC] text-[#46556E]';
};

export default function WalletTransactionsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { walletNumber = '' } = useParams();
  const { state } = useLocation();
  const routeWallet = (state as { wallet?: Wallet } | null)?.wallet ?? null;
  const { items, lastFetchedAt, loading, transactionsError, transactionsLoading, transactionsResult } = useAppSelector(
    (reduxState) => reduxState.wallet,
  );
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionType, setTransactionType] = useState<WalletTransactionType | ''>('');
  const [transactionChannel, setTransactionChannel] = useState<WalletTransactionChannel | ''>('');
  const [transactionStatus, setTransactionStatus] = useState<WalletTransactionStatus | ''>('');

  const decodedWalletNumber = useMemo(() => decodeURIComponent(walletNumber), [walletNumber]);
  const wallet = items.find((item) => item.walletNumber === decodedWalletNumber) ?? routeWallet;
  const currency = wallet?.currency ?? 'NGN';
  const transactionsData = transactionsResult?.data;
  const transactionItems = transactionsData?.items ?? [];

  useEffect(() => {
    if (!lastFetchedAt && !loading) {
      dispatch(fetchWalletsThunk());
    }
  }, [dispatch, lastFetchedAt, loading]);

  useEffect(() => {
    dispatch(clearWalletTransactionsStatus());

    return () => {
      dispatch(clearWalletTransactionsStatus());
    };
  }, [dispatch, decodedWalletNumber]);

  useEffect(() => {
    if (!decodedWalletNumber) return;

    dispatch(
      fetchWalletTransactionsThunk({
        walletNumber: decodedWalletNumber,
        query: {
          currPage: transactionPage,
          perPage: transactionsPerPage,
          type: transactionType,
          channel: transactionChannel,
          status: transactionStatus,
        },
      }),
    );
  }, [decodedWalletNumber, dispatch, transactionChannel, transactionPage, transactionStatus, transactionType]);

  const retryTransactions = () => {
    if (!decodedWalletNumber) return;

    dispatch(
      fetchWalletTransactionsThunk({
        walletNumber: decodedWalletNumber,
        query: {
          currPage: transactionPage,
          perPage: transactionsPerPage,
          type: transactionType,
          channel: transactionChannel,
          status: transactionStatus,
        },
      }),
    );
  };

  return (
    <AppShell>
      <main className="mx-auto grid w-full max-w-[78rem] gap-5 px-4 py-6 pb-28 sm:px-6 md:px-9 md:py-9">
        <header className="grid gap-4">
          <AppButton
            className="justify-self-start"
            leftIcon={<ArrowLeft className="size-4" aria-hidden />}
            variant="ghost"
            onClick={() => navigate(paths.wallet)}
          >
            Wallet
          </AppButton>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_28px_rgba(11,31,74,0.08)]">
            <AppText variant="caption" color="textMuted" weight="bold">
              Transaction history
            </AppText>
            <AppText variant="h4">{wallet?.displayName || `${currency} Wallet`}</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              Wallet No. {decodedWalletNumber || 'Not provided'}
            </AppText>
          </div>
        </header>

        <section className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_18px_rgba(11,31,74,0.05)] sm:grid-cols-3">
          <AppDropdown
            label="Type"
            options={transactionTypeOptions}
            value={transactionType}
            onChange={(nextValue) => {
              setTransactionType((Array.isArray(nextValue) ? nextValue[0] : nextValue) as WalletTransactionType | '');
              setTransactionPage(1);
            }}
          />
          <AppDropdown
            label="Channel"
            options={transactionChannelOptions}
            value={transactionChannel}
            onChange={(nextValue) => {
              setTransactionChannel((Array.isArray(nextValue) ? nextValue[0] : nextValue) as WalletTransactionChannel | '');
              setTransactionPage(1);
            }}
          />
          <AppDropdown
            label="Status"
            options={transactionStatusOptions}
            value={transactionStatus}
            onChange={(nextValue) => {
              setTransactionStatus((Array.isArray(nextValue) ? nextValue[0] : nextValue) as WalletTransactionStatus | '');
              setTransactionPage(1);
            }}
          />
        </section>

        {transactionsLoading && !transactionsResult ? (
          <section className="grid min-h-60 place-items-center">
            <AppLoader label="Loading transactions" />
          </section>
        ) : transactionsError ? (
          <section className="grid gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
            <AppText variant="bodyMedium" color="#B91C1C" weight="bold">
              {transactionsError}
            </AppText>
            <AppButton
              leftIcon={<RefreshCw className="size-4" aria-hidden />}
              loading={transactionsLoading}
              onClick={retryTransactions}
            >
              Retry
            </AppButton>
          </section>
        ) : transactionItems.length === 0 ? (
          <section className="grid min-h-48 place-items-center rounded-xl border border-[#E5E7EB] bg-white p-4 text-center">
            <AppText variant="bodyMedium" color="textSecondary" align="center">
              No transactions found.
            </AppText>
          </section>
        ) : (
          <section className="grid gap-3">
            {transactionItems.map((transaction) => {
              const isCredit = transaction.type === 'credit';

              return (
                <article className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4" key={transaction.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid min-w-0 gap-1">
                      <AppText variant="bodyMedium" weight="bold">
                        {transaction.description || formatLabel(transaction.channel)}
                      </AppText>
                      <AppText variant="caption" color="textMuted" weight="bold">
                        {formatDate(transaction.createdAt)}
                      </AppText>
                    </div>
                    <AppText variant="bodyMedium" color={isCredit ? '#047857' : '#B91C1C'} weight="bold" align="right">
                      {isCredit ? '+' : '-'}
                      {formatMinorMoney(transaction.amount, currency)}
                    </AppText>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#D6DEEB] bg-[#F8FAFC] px-2.5 py-1 text-xs font-bold text-[#123B8D]">
                      {formatLabel(transaction.type)}
                    </span>
                    <span className="rounded-full border border-[#D6DEEB] bg-[#F8FAFC] px-2.5 py-1 text-xs font-bold text-[#46556E]">
                      {formatLabel(transaction.channel)}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusClassName(transaction.status)}`}>
                      {formatLabel(transaction.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-[#F8FAFC] p-3">
                    <div className="grid gap-1">
                      <AppText variant="caption" color="textMuted" weight="bold">
                        Before
                      </AppText>
                      <AppText variant="bodySmall" weight="bold">
                        {formatMinorMoney(transaction.balanceBefore, currency)}
                      </AppText>
                    </div>
                    <div className="grid gap-1">
                      <AppText variant="caption" color="textMuted" weight="bold">
                        After
                      </AppText>
                      <AppText variant="bodySmall" weight="bold">
                        {formatMinorMoney(transaction.balanceAfter, currency)}
                      </AppText>
                    </div>
                  </div>

                  <AppButton
                    fullWidth
                    leftIcon={<Eye className="size-4" aria-hidden />}
                    variant="outline"
                    onClick={() =>
                      navigate(paths.walletTransactionDetails(decodedWalletNumber, transaction.id), {
                        state: { transaction, wallet },
                      })
                    }
                  >
                    View details
                  </AppButton>
                </article>
              );
            })}
          </section>
        )}

        {transactionsData && transactionsData.totalPages > 1 && (
          <section className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
            <AppText variant="bodySmall" color="textSecondary" align="center">
              Page {transactionsData.currPage} of {transactionsData.totalPages}
            </AppText>
            <div className="grid grid-cols-2 gap-3">
              <AppButton
                disabled={transactionsLoading || transactionPage <= 1}
                variant="secondary"
                onClick={() => setTransactionPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </AppButton>
              <AppButton
                disabled={transactionsLoading || transactionPage >= transactionsData.totalPages}
                onClick={() => setTransactionPage((page) => page + 1)}
              >
                Next
              </AppButton>
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}
