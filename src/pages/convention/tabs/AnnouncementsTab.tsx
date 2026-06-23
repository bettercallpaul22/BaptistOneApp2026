import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Megaphone, RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppLoader } from '@/components/feedback';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchConventionAnnouncementsThunk } from '@/store/thunks/conventionThunk';
import { paths } from '@/routes/paths';
import type { ConventionAnnouncement } from '@/types/convention';

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
};

const AnnouncementCard = ({
  announcement,
  onViewDetails,
}: {
  announcement: ConventionAnnouncement;
  onViewDetails: (a: ConventionAnnouncement) => void;
}) => (
  <article className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_4px_12px_rgba(11,31,74,0.08)]">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#EAF1FF] text-[#123B8D]">
          <Megaphone className="size-5" />
        </span>
        <div className="min-w-0 grid gap-1">
          <AppText variant="h6" className="font-bold text-[#0B1F4A] line-clamp-1">{announcement.title}</AppText>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#EAF1FF] px-2 py-0.5 text-[10px] font-semibold text-[#123B8D]">
              {announcement.type}
            </span>
            {announcement.isActive && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Active
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
    <AppText variant="bodySmall" color="textSecondary" className="mt-2 line-clamp-3">
      {announcement.body}
    </AppText>
    {announcement.startsAt && (
      <AppText variant="caption" color="textMuted" className="mt-2">
        {formatDate(announcement.startsAt)}
        {announcement.endsAt && ` — ${formatDate(announcement.endsAt)}`}
      </AppText>
    )}
    {announcement.audienceTargets?.length > 0 && (
      <div className="mt-2 flex flex-wrap gap-1">
        {announcement.audienceTargets.map((target) => (
          <span key={target} className="inline-flex items-center rounded-full bg-[#F8FAFC] px-2 py-0.5 text-[10px] font-semibold text-[#5A6880]">
            {target}
          </span>
        ))}
      </div>
    )}
    <div className="mt-3">
      <AppButton size="sm" variant="ghost" onClick={() => onViewDetails(announcement)}>
        View Details
      </AppButton>
    </div>
  </article>
);

export function AnnouncementsTab({ conventionId }: { conventionId: string }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items = [], meta = null, loading = false, loadingMore = false, error = null } = useAppSelector((state) => state.convention?.announcements ?? {});

  const [searchInput, setSearchInput] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const currentPage = meta?.page ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const hasMore = currentPage < totalPages;

  const fetchPage = useCallback(
    (page: number, search?: string) => {
      dispatch(fetchConventionAnnouncementsThunk({ conventionId, page, limit: 25, search }));
    },
    [dispatch, conventionId],
  );

  useEffect(() => {
    fetchPage(1);
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

  const handleViewDetails = useCallback(
    (announcement: ConventionAnnouncement) => {
      navigate(paths.conventionAnnouncementDetail, { state: { announcement } });
    },
    [navigate],
  );

  const retry = useCallback(() => {
    fetchPage(1, searchInput);
  }, [fetchPage, searchInput]);

  if (loading && items.length === 0) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <AppLoader label="Loading announcements" />
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
            <AppText variant="h5" color="#991B1B" align="center">Unable to load announcements</AppText>
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
          placeholder="Search announcements..."
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {items.length === 0 && !loading ? (
        <div className="grid min-h-[30vh] place-items-center">
          <AppText variant="h5" align="center">No announcements</AppText>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} onViewDetails={handleViewDetails} />
          ))}
        </div>
      )}

      {loadingMore && <div className="grid py-4 place-items-center"><AppLoader label="Loading more" /></div>}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
