import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppAvatar, ProfileCard } from '@/components/display';
import { AppModal, AppStateFeedback } from '@/components/feedback';
import { useChurchScreenBootstrapApi } from '@/hooks/useChurchScreenBootstrapApi';
import { churchService } from '@/services/church/churchService';
import type { ChurchLeadershipItem, ChurchLeadershipMeta } from '@/types/church';
import {
  getLeaderGroupTitle,
  getLeaderName,
  getLeaderRole,
  getLeaderTypeKey,
  sortLeadership,
} from './churchLeadershipUtils';

export type ChurchBootstrapState = ReturnType<typeof useChurchScreenBootstrapApi>;

const getLeadershipPanelTitle = (type?: string | null) => (type ? getLeaderGroupTitle({ type }) : 'Leaders');

const ChurchLeaderDetailsModal = ({ leader, onClose }: { leader: ChurchLeadershipItem | null; onClose: () => void }) => (
  <AppModal
    open={Boolean(leader)}
    title="Leader details"
    onClose={onClose}
    footer={
      <AppButton className="col-span-2" variant="secondary" onClick={onClose}>
        Close
      </AppButton>
    }
  >
    {leader && (
      <div className="grid gap-5">
        <div className="grid justify-items-center gap-3 text-center">
          <AppAvatar name={getLeaderName(leader)} src={leader.image?.url ?? undefined} size="xl" />
          <div className="grid gap-1">
            <AppText variant="h5" align="center">
              {getLeaderName(leader)}
            </AppText>
            <AppText variant="bodySmall" color="textSecondary" align="center">
              {getLeaderRole(leader)} - {getLeaderGroupTitle(leader)}
            </AppText>
          </div>
        </div>

        {(leader.email || leader.phone) && (
          <div className="grid gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3 text-sm font-semibold text-[#43536D]">
            {leader.email && (
              <span className="inline-flex min-w-0 items-center gap-2">
                <Mail className="size-4 shrink-0 text-[#123B8D]" aria-hidden />
                <span className="min-w-0 truncate">{leader.email}</span>
              </span>
            )}
            {leader.phone && (
              <span className="inline-flex min-w-0 items-center gap-2">
                <Phone className="size-4 shrink-0 text-[#123B8D]" aria-hidden />
                <span className="min-w-0 truncate">{leader.phone}</span>
              </span>
            )}
          </div>
        )}

        <AppText variant="bodyMedium" color="textSecondary">
          {leader.bio?.trim() || 'No biography has been added yet.'}
        </AppText>
      </div>
    )}
  </AppModal>
);

export const ChurchLeadershipPanel = ({
  bootstrap,
  type,
}: {
  bootstrap: ChurchBootstrapState;
  type?: string | null;
}) => {
  const normalizedType = type?.trim().toUpperCase() || null;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [selectedLeader, setSelectedLeader] = useState<ChurchLeadershipItem | null>(null);
  const [extraLeadership, setExtraLeadership] = useState<{ churchId: string; items: ChurchLeadershipItem[]; meta: ChurchLeadershipMeta } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<{ churchId: string; message: string } | null>(null);
  const { church, error, leadership, leadershipLoading, leadershipMeta, loading, retry } = bootstrap;
  const panelTitle = getLeadershipPanelTitle(normalizedType);
  const currentExtraLeadership = extraLeadership?.churchId === church?.id ? extraLeadership : null;
  const allLeadership = useMemo(
    () => [
      ...leadership,
      ...(currentExtraLeadership?.items ?? []).filter((nextLeader) => !leadership.some((leader) => leader.id === nextLeader.id)),
    ],
    [currentExtraLeadership?.items, leadership],
  );
  const allLeadershipMeta = currentExtraLeadership?.meta ?? leadershipMeta;
  const leaders = sortLeadership(
    normalizedType ? allLeadership.filter((leader) => getLeaderTypeKey(leader) === normalizedType) : allLeadership,
  );
  const isLoading = leadershipLoading || (loading && !leadershipMeta);
  const hasMore = Boolean(allLeadershipMeta && allLeadershipMeta.page < allLeadershipMeta.totalPages);
  const nextPage = (allLeadershipMeta?.page ?? 1) + 1;
  const currentLoadMoreError = loadMoreError && loadMoreError.churchId === church?.id ? loadMoreError.message : null;

  const loadMoreLeadership = useCallback(async () => {
    if (!church?.id || !hasMore || loadingMore) return;

    setLoadingMore(true);
    setLoadMoreError(null);

    try {
      const response = await churchService.getLeadership(church.id, { page: nextPage, limit: allLeadershipMeta?.limit ?? 20 });

      setExtraLeadership((current) => ({
        churchId: church.id,
        items:
          current?.churchId === church.id
            ? [
                ...current.items,
                ...response.items.filter((nextLeader) => !current.items.some((leader) => leader.id === nextLeader.id)),
              ]
            : response.items,
        meta: response.meta,
      }));
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to load more leaders.';

      setLoadMoreError({ churchId: church.id, message });
    } finally {
      setLoadingMore(false);
    }
  }, [allLeadershipMeta, church, hasMore, loadingMore, nextPage, setExtraLeadership, setLoadMoreError, setLoadingMore]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;

    if (!sentinel || !hasMore || loadingMore || currentLoadMoreError || isLoading || error) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        void loadMoreLeadership();
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [currentLoadMoreError, error, hasMore, isLoading, loadMoreLeadership, loadingMore]);

  return (
    <section className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_18px_rgba(11,31,74,0.06)]">
      {isLoading && <AppStateFeedback state="loading" label={`Loading ${panelTitle.toLowerCase()}`} className="min-h-44" />}
      {error && !isLoading && (
        <AppStateFeedback
          state="error"
          title="Unable to load leaders"
          description={error}
          retrying={loading}
          className="min-h-44"
          onRetry={retry}
        />
      )}
      {!isLoading && !error && !leaders.length && (
        <AppStateFeedback
          state="empty"
          title={`No ${panelTitle.toLowerCase()} yet`}
          description="Leaders added by your church will appear here."
          className="min-h-44"
        />
      )}
      {!isLoading && !error && leaders.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {leaders.map((leader) => (
            <ProfileCard
              key={leader.id}
              name={getLeaderName(leader)}
              role={getLeaderRole(leader)}
              avatarUrl={leader.image?.url}
              onViewDetails={() => setSelectedLeader(leader)}
            />
          ))}
        </div>
      )}
      {hasMore && !currentLoadMoreError && (
        <div ref={loadMoreRef} className="grid min-h-16 place-items-center">
          {loadingMore ? (
            <AppStateFeedback state="loading" label="Loading more leaders" className="min-h-16" />
          ) : (
            <span className="text-xs font-semibold text-[#8A96AA]">Scroll for more</span>
          )}
        </div>
      )}
      {currentLoadMoreError && (
        <div className="grid gap-2 rounded-lg border border-red-100 bg-red-50 p-3">
          <AppText variant="bodySmall" color="#B91C1C">
            {currentLoadMoreError}
          </AppText>
          <AppButton loading={loadingMore} size="sm" variant="outline" onClick={() => void loadMoreLeadership()}>
            Retry
          </AppButton>
        </div>
      )}

      <ChurchLeaderDetailsModal leader={selectedLeader} onClose={() => setSelectedLeader(null)} />
    </section>
  );
};
