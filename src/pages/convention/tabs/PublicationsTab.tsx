import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BookOpen, ExternalLink, RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppLoader } from '@/components/feedback';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchConventionPublicationsThunk, fetchPublicationAccessesThunk } from '@/store/thunks/conventionThunk';
import { paths } from '@/routes/paths';
import type { ConventionPublication } from '@/types/convention';

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
};

const pricingLabel: Record<string, string> = {
  FREE: 'Free',
  ONE_TIME: 'One-time',
  SUBSCRIPTION: 'Subscription',
};

const PublicationCard = ({
  publication,
  hasAccess,
  onBuy,
  onGetFree,
}: {
  publication: ConventionPublication;
  hasAccess: boolean;
  onBuy: (p: ConventionPublication) => void;
  onGetFree: (p: ConventionPublication) => void;
}) => (
  <article className="flex flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_4px_12px_rgba(11,31,74,0.08)]">
    <div className="relative h-32 bg-gradient-to-br from-[#7C3AED] to-[#5B21B6]">
      {publication.coverFile?.url ? (
        <img className="h-full w-full object-cover" src={publication.coverFile.url} alt={publication.title} />
      ) : (
        <div className="grid h-full place-items-center opacity-20">
          <BookOpen className="size-12 text-white" />
        </div>
      )}
      <div className="absolute bottom-2 left-3 flex items-center gap-2">
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          {pricingLabel[publication.pricingModel] ?? publication.pricingModel}
        </span>
        {publication.pricingModel !== 'FREE' && (
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-[#0B1F4A]">
            {formatMoney(publication.price, publication.currency)}
          </span>
        )}
      </div>
      {hasAccess && (
        <span className="absolute top-2 right-2 rounded-full bg-emerald-400/90 px-2 py-0.5 text-[10px] font-bold text-white">
          Purchased
        </span>
      )}
    </div>
    <div className="flex flex-1 flex-col gap-2 p-4">
      <AppText variant="h6" className="font-bold text-[#0B1F4A] line-clamp-1">{publication.title}</AppText>
      <AppText variant="caption" color="textMuted">by {publication.author}</AppText>
      <AppText variant="bodySmall" color="textSecondary" className="line-clamp-2">
        {publication.summary || publication.description}
      </AppText>
      <div className="mt-auto grid gap-2 pt-2">
        {hasAccess ? (
          <AppButton fullWidth size="sm" variant="outline" rightIcon={<ExternalLink className="size-3.5" />}>
            View Content
          </AppButton>
        ) : publication.pricingModel === 'FREE' ? (
          <AppButton fullWidth size="sm" onClick={() => onGetFree(publication)}>
            Get Free
          </AppButton>
        ) : (
          <AppButton fullWidth size="sm" onClick={() => onBuy(publication)}>
            Buy
          </AppButton>
        )}
      </div>
    </div>
  </article>
);

export function PublicationsTab({ conventionId }: { conventionId: string }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items = [], meta = null, loading = false, loadingMore = false, error = null } = useAppSelector((state) => state.convention?.publications ?? {});
  const accesses = useAppSelector((state) => state.convention?.accesses?.items ?? []);

  const [searchInput, setSearchInput] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const currentPage = meta?.page ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const hasMore = currentPage < totalPages;

  const accessiblePublicationIds = useMemo(() => new Set(accesses.map((a) => a.publicationId)), [accesses]);

  const fetchPage = useCallback(
    (page: number, search?: string) => {
      dispatch(fetchConventionPublicationsThunk({ conventionId, page, limit: 25, search }));
    },
    [dispatch, conventionId],
  );

  useEffect(() => {
    fetchPage(1);
    dispatch(fetchPublicationAccessesThunk(conventionId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conventionId]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchPage(currentPage + 1, searchInput);
        }
      },
      { threshold: 0.1 },
    );
    observerRef.current.observe(sentinelRef.current);
    return () => { observerRef.current?.disconnect(); };
  }, [hasMore, loading, loadingMore, currentPage, searchInput, fetchPage]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => fetchPage(1, value), 400);
    },
    [fetchPage],
  );

  const handleBuy = useCallback(
    (publication: ConventionPublication) => {
      navigate(paths.conventionPublicationPayment, { state: { publication } });
    },
    [navigate],
  );

  const handleGetFree = useCallback(
    (publication: ConventionPublication) => {
      navigate(paths.conventionPublicationPayment, { state: { publication } });
    },
    [navigate],
  );

  const retry = useCallback(() => {
    fetchPage(1, searchInput);
  }, [fetchPage, searchInput]);

  if (loading && items.length === 0) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <AppLoader label="Loading publications" />
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
            <AlertCircle className="size-6" />
          </span>
          <div className="grid gap-1">
            <AppText variant="h5" color="#991B1B" align="center">Unable to load publications</AppText>
            <AppText variant="bodySmall" color="#B91C1C" align="center">{error}</AppText>
          </div>
          <AppButton leftIcon={<RefreshCw className="size-4" />} loading={loading} onClick={retry}>Retry</AppButton>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#79859A]" />
        <input
          className="w-full rounded-xl border border-[#D6DEEB] bg-white py-3 pl-10 pr-4 text-sm font-semibold text-[#0B1F4A] outline-none transition placeholder:text-[#A8B3C4] focus:border-[#123B8D] focus:ring-3 focus:ring-[#123B8D]/10"
          placeholder="Search publications..."
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {accesses.length > 0 && (
        <AppButton variant="outline" fullWidth onClick={() => navigate(paths.conventionMyPublications, { state: { conventionId } })}>
          View My Publications ({accesses.length})
        </AppButton>
      )}

      {items.length === 0 && !loading ? (
        <div className="grid min-h-[30vh] place-items-center">
          <AppText variant="h5" align="center">No publications found</AppText>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((pub) => (
            <PublicationCard
              key={pub.id}
              publication={pub}
              hasAccess={accessiblePublicationIds.has(pub.id) || pub.pricingModel === 'FREE'}
              onBuy={handleBuy}
              onGetFree={handleGetFree}
            />
          ))}
        </div>
      )}

      {loadingMore && <div className="grid py-4 place-items-center"><AppLoader label="Loading more" /></div>}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
