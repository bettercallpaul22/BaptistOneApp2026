import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppScrollableTabs, AppText } from '@/components/common';
import { AppAvatar, AppCard } from '@/components/display';
import { AppShell } from '@/layouts/AppShell';
import { AppStateFeedback } from '@/components/feedback';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchForumsThunk } from '@/store/thunks/forumThunk';
import { fetchUserDepartmentsThunk, fetchUserUnitsThunk } from '@/store/slices/forumSlice';
import { paths } from '@/routes/paths';
import { useChurchScreenBootstrapApi } from '@/hooks/useChurchScreenBootstrapApi';
import type { ForumItem } from '@/services/forum/forumService';

const tabItems = [
  { value: 'forums', label: 'Forums' },
  { value: 'departments', label: 'Departments' },
  { value: 'units', label: 'Units' },
] as const;

type ForumTab = (typeof tabItems)[number]['value'];

const ForumPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ForumTab>('forums');

  useChurchScreenBootstrapApi();

  const memberAccount = useAppSelector((state) => state.member.data);
  const churchDetails = useAppSelector((state) => state.church.details);

  const {
    items: forums,
    meta,
    loading,
    loadingMore,
    error,
    loadMoreError,
    departments,
    units,
    departmentsLoading,
    unitsLoading,
    departmentsError,
    unitsError,
  } = useAppSelector((state) => state.forum);

  const hasMore = Boolean(meta && meta.page < meta.totalPages);
  const nextPage = (meta?.page ?? 1) + 1;
  const isInitialLoading = loading && !forums.length;
  const currentLoadMoreError = loadMoreError;

  const memberName =
    memberAccount?.basicProfile?.displayName ||
    [memberAccount?.basicProfile?.firstName, memberAccount?.basicProfile?.lastName]
      .filter(Boolean)
      .join(' ') ||
    'Member';

  const memberAvatar = memberAccount?.basicProfile?.avatarUrl || undefined;
  const churchLogoSrc = useMemo(() => {
    if (!churchDetails) return undefined;
    return (
      churchDetails.coverImageUrl || churchDetails.coverImage || churchDetails.image || churchDetails.logo || undefined
    );
  }, [churchDetails]);

  useEffect(() => {
    if (!forums.length && !loading && !error) {
      void dispatch(fetchForumsThunk({ page: 1, limit: 20 }));
    }
  }, [dispatch, error, forums.length, loading]);

  useEffect(() => {
    if (!departments.length && !departmentsLoading && !departmentsError) {
      void dispatch(fetchUserDepartmentsThunk());
    }

    if (!units.length && !unitsLoading && !unitsError) {
      void dispatch(fetchUserUnitsThunk());
    }
  }, [departments.length, departmentsError, departmentsLoading, dispatch, units.length, unitsError, unitsLoading]);

  const loadMoreForums = useCallback(() => {
    if (!hasMore || loadingMore) return;

    void dispatch(fetchForumsThunk({ page: nextPage, limit: meta?.limit ?? 20 }));
  }, [dispatch, hasMore, loadingMore, meta?.limit, nextPage]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;

    if (!sentinel || !hasMore || loading || loadingMore || currentLoadMoreError || error) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        void loadMoreForums();
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [currentLoadMoreError, error, hasMore, loadMoreForums, loading, loadingMore]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as ForumTab);
    if (value === 'departments') {
      void dispatch(fetchUserDepartmentsThunk());
    } else if (value === 'units') {
      void dispatch(fetchUserUnitsThunk());
    }
  };

  const renderForumCard = (forum: ForumItem) => {
    return (
      <div
        key={forum.id}
        className="cursor-pointer transition-transform hover:scale-105"
        role="button"
        tabIndex={0}
        onClick={() => navigate(paths.forumDetails(forum.id))}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            navigate(paths.forumDetails(forum.id));
          }
        }}
      >
        <AppCard className="shadow-[0_4px_12px_rgba(11,31,74,0.08)] hover:shadow-[0_8px_16px_rgba(11,31,74,0.12)] transition-shadow">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                <AppText variant="h6" className="line-clamp-2">{forum.title}</AppText>
              </div>
              <span className="rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-semibold text-[#123B8D] whitespace-nowrap flex-shrink-0">
                {forum.forumType}
              </span>
            </div>
            <AppText variant="caption" color="textSecondary" className="line-clamp-2">
              {forum.description}
            </AppText>
          </div>
        </AppCard>
      </div>
    );
  };

  return (
    <AppShell
      mobileHeaderAddon={
        <div className="min-w-0 bg-white/95 backdrop-blur-xl">
          <div className="min-w-0 border-b border-[#E5E7EB]">
            <div className="mx-auto max-w-[78rem] px-4 py-6 sm:px-6 md:px-9">
              <div className="grid gap-6">
                {/* Top row: Member greeting stacked below avatar */}
                <div className="flex flex-col items-start gap-3">
                  <AppAvatar name={memberName} src={memberAvatar} size="lg" />
                  <AppText variant="h5" className="font-bold text-[#0B1F4A]">
                    Hi, {memberName.split(' ')[0]}!
                  </AppText>
                </div>

                {/* Center: Church name and slug */}
                <div className="grid gap-2 text-center">
                  <AppText variant="h2" className="text-4xl font-extrabold">
                    Welcome to{'\n'}{churchDetails?.name}
                  </AppText>
                 
                </div>
              </div>
            </div>

            <div className="mx-auto max-w-[78rem] px-4 sm:px-6 md:px-9">
              <AppScrollableTabs
                tabs={tabItems.map((item) => ({ value: item.value, label: item.label }))}
                value={activeTab}
                onValueChange={handleTabChange}
                ariaLabel="Forum navigation tabs"
                fullWidthTabs
              />
            </div>
          </div>
        </div>
      }
    >
      <main className="min-w-0">
        <section className="mx-auto max-w-[78rem] px-4 py-6 pb-28 sm:px-6 md:px-9" role="tabpanel" aria-label={activeTab}>
          {isInitialLoading && (
            <AppStateFeedback state="loading" label="Loading forums" className="min-h-44" />
          )}

          {error && !forums.length && !isInitialLoading && (
            <AppStateFeedback
              state="error"
              title="Unable to load forums"
              description={error}
              retrying={loading}
              className="min-h-44"
              onRetry={() => void dispatch(fetchForumsThunk({ page: 1, limit: meta?.limit ?? 20 }))}
            />
          )}

          {!isInitialLoading && !error && !forums.length && (
            <AppStateFeedback
              state="empty"
              title="No forums yet"
              description="No forum spaces are available at the moment."
              className="min-h-44"
            />
          )}

          {!isInitialLoading && !error && forums.length > 0 && (
            <>
              {activeTab === 'forums' && (
                <div className="grid gap-4">{forums.map((forum) => renderForumCard(forum))}</div>
              )}

              {activeTab === 'departments' && (
                <div className="grid gap-4">
                  {departments.map((department) => (
                    <AppCard key={department.id} className="shadow-[0_10px_24px_rgba(11,31,74,0.05)]">
                      <div className="flex items-start justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <AppText variant="h6">{department.title}</AppText>
                          <AppText variant="caption" color="textSecondary">
                            {department.description}
                          </AppText>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 px-4 pb-4">
                        <span className="rounded-full bg-[#EEF4FF] px-2 py-1 text-xs font-semibold text-[#123B8D]">
                          Department
                        </span>
                      </div>
                    </AppCard>
                  ))}
                </div>
              )}

              {activeTab === 'units' && (
                <div className="grid gap-4">
                  {units.map((unit) => (
                    <AppCard key={unit.id} className="shadow-[0_10px_24px_rgba(11,31,74,0.05)]">
                      <div className="flex items-start justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <AppText variant="h6">{unit.title}</AppText>
                          <AppText variant="caption" color="textSecondary">
                            {unit.description}
                          </AppText>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 px-4 pb-4">
                        <span className="rounded-full bg-[#EEF4FF] px-2 py-1 text-xs font-semibold text-[#123B8D]">
                          Unit
                        </span>
                      </div>
                    </AppCard>
                  ))}
                </div>
              )}

              {hasMore && !currentLoadMoreError && (
                <div ref={loadMoreRef} className="grid min-h-16 place-items-center">
                  {loadingMore ? (
                    <AppStateFeedback state="loading" label="Loading more forums" className="min-h-16" />
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
                  <AppButton loading={loadingMore} size="sm" variant="outline" onClick={() => void loadMoreForums()}>
                    Retry
                  </AppButton>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </AppShell>
  );
};

export default ForumPage;
