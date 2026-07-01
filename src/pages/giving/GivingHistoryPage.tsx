import { useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppShell } from '@/layouts/AppShell';
import { AppLoader } from '@/components/feedback';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchGivingHistoryThunk } from '@/store/thunks/givingThunk';
import { paths } from '@/routes/paths';
import type { GivingHistoryItem } from '@/types/giving';

const HISTORY_LIMIT = 20;

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

const formatMinorMoney = (value: number, currency: string) => formatMoney(value / minorUnitMultiplier, currency);

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || 'Not provided';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const statusClassName: Record<string, string> = {
  completed: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  pending: 'border-amber-100 bg-amber-50 text-amber-700',
  failed: 'border-red-100 bg-red-50 text-red-700',
};

const GivingHistoryPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { historyItems, historyLoading, historyLoadingMore, historyError, historyHasMore } = useAppSelector(
    (state) => state.giving,
  );

  const loadMore = useCallback(() => {
    if (!historyHasMore || historyLoadingMore) return;
    void dispatch(fetchGivingHistoryThunk({ limit: HISTORY_LIMIT, offset: historyItems.length }));
  }, [dispatch, historyHasMore, historyLoadingMore, historyItems.length]);

  useEffect(() => {
    void dispatch(fetchGivingHistoryThunk({ limit: HISTORY_LIMIT, offset: 0 }));
  }, [dispatch]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !historyHasMore || historyLoading || historyLoadingMore || historyError) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        loadMore();
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [historyHasMore, historyLoading, historyLoadingMore, historyError, loadMore]);

  const renderItem = (item: GivingHistoryItem) => {
    const status = item.status || 'pending';
    const badgeClass = statusClassName[status] ?? 'border-[#D6DEEB] bg-[#F8FAFC] text-[#46556E]';
    const subtype = item.meta?.finance?.subtype ?? 'donation';

    return (
      <article className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4" key={item.id}>
        <div className="flex items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1">
            <AppText variant="bodyMedium" weight="bold">
              {subtype.charAt(0).toUpperCase() + subtype.slice(1)}
            </AppText>
            <AppText variant="caption" color="textMuted" weight="bold">
              {formatDate(item.createdAt)}
            </AppText>
          </div>
          <AppText variant="bodyMedium" color="#047857" weight="bold" align="right">
            {formatMinorMoney(item.amountTotal, item.currency)}
          </AppText>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${badgeClass}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          {item.feesAmountTotal > 0 && (
            <span className="rounded-full border border-[#D6DEEB] bg-[#F8FAFC] px-2.5 py-1 text-xs font-bold text-[#46556E]">
              Fee: {formatMinorMoney(item.feesAmountTotal, item.currency)}
            </span>
          )}
        </div>
      </article>
    );
  };

  return (
    <AppShell
      mobileHeaderAddon={
        <div className="min-w-0 bg-white/95 backdrop-blur-xl">
          <div className="min-w-0 border-b border-[#E5E7EB]">
            <div className="mx-auto max-w-[78rem] px-4 py-3 sm:px-6 md:px-9">
              <AppButton
                leftIcon={<ArrowLeft />}
                variant="ghost"
                className="max-w-full overflow-hidden"
                onClick={() => navigate(paths.donation)}
              >
                Back to Giving
              </AppButton>
            </div>
          </div>
        </div>
      }
    >
      <main className="mx-auto grid w-full max-w-[78rem] gap-5 px-4 py-6 pb-28 sm:px-6 md:px-9 md:py-9">
        <div className="flex items-center justify-between">
          <AppText variant="h5">Giving History</AppText>
        </div>

        {historyLoading && !historyItems.length ? (
          <section className="grid min-h-60 place-items-center">
            <AppLoader label="Loading giving history" />
          </section>
        ) : historyError && !historyItems.length ? (
          <section className="grid gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
            <AppText variant="bodyMedium" color="#B91C1C" weight="bold">
              {historyError}
            </AppText>
            <AppButton
              leftIcon={<RefreshCw className="size-4" aria-hidden />}
              loading={historyLoading}
              onClick={() => void dispatch(fetchGivingHistoryThunk({ limit: HISTORY_LIMIT, offset: 0 }))}
            >
              Retry
            </AppButton>
          </section>
        ) : !historyItems.length ? (
          <section className="grid min-h-48 place-items-center rounded-xl border border-[#E5E7EB] bg-white p-4 text-center">
            <AppText variant="bodyMedium" color="textSecondary" align="center">
              No giving history yet.
            </AppText>
          </section>
        ) : (
          <section className="grid gap-3">
            {historyItems.map((item) => renderItem(item))}

            {historyHasMore && (
              <div ref={loadMoreRef} className="grid min-h-16 place-items-center">
                {historyLoadingMore ? (
                  <AppLoader label="Loading more" />
                ) : (
                  <span className="text-xs font-semibold text-[#8A96AA]">Scroll for more</span>
                )}
              </div>
            )}

            {!historyHasMore && historyItems.length > 0 && (
              <div className="grid place-items-center py-4">
                <AppText variant="caption" color="textMuted">
                  {historyItems.length} of {historyItems.length} transactions
                </AppText>
              </div>
            )}
          </section>
        )}
      </main>
    </AppShell>
  );
};

export default GivingHistoryPage;
