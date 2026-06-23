import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppScrollableTabs, AppText } from '@/components/common';
import { AppCard, UserProfileImage } from '@/components/display';
import { ChurchMembershipGuard } from '@/components/guards';
import { AppShell } from '@/layouts/AppShell';
import { AppStateFeedback } from '@/components/feedback';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchForumsThunk } from '@/store/thunks/forumThunk';
import { fetchChurchDepartmentsThunk, fetchDepartmentRequestsThunk, fetchUserUnitsThunk, joinDepartmentThunk, joinUnitThunk, fetchUnitRequestsThunk } from '@/store/slices/forumSlice';
import { paths } from '@/routes/paths';
import { useChurchScreenBootstrapApi } from '@/hooks/useChurchScreenBootstrapApi';
import type { ForumItem } from '@/services/forum/forumService';
import { pushNotification } from '@/store/slices/notificationSlice';

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
    churchDepartments,
    units,
    churchDepartmentsLoading,
    unitsLoading,
    churchDepartmentsError,
    unitsError,
    joiningDepartmentId,
    joinDepartmentError,
    departmentRequests,
    departmentRequestsLoading,
    joiningUnitId,
    joinUnitError,
    unitRequests,
    unitRequestsLoading,
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

  const churchLogoSrc = useMemo(() => {
    if (!churchDetails) return undefined;
    return (
      churchDetails.coverImageUrl || churchDetails.coverImage || churchDetails.image || churchDetails.logo || undefined
    );
  }, [churchDetails]);

  const hasFetchedInitial = useRef(false);
  const hasFetchedDepartments = useRef(false);
  const hasFetchedUnits = useRef(false);

  useEffect(() => {
    if (hasFetchedInitial.current) return;
    if (loading || error) return;
    hasFetchedInitial.current = true;
    void dispatch(fetchForumsThunk({ page: 1, limit: 20 }));
  }, [dispatch, error, loading]);

  useEffect(() => {
    if (hasFetchedDepartments.current) return;
    if (churchDepartmentsLoading) return;
    hasFetchedDepartments.current = true;
    void dispatch(fetchChurchDepartmentsThunk());
    void dispatch(fetchDepartmentRequestsThunk());
  }, [churchDepartmentsLoading, dispatch]);

  useEffect(() => {
    if (hasFetchedUnits.current) return;
    if (unitsLoading) return;
    hasFetchedUnits.current = true;
    void dispatch(fetchUserUnitsThunk());
    void dispatch(fetchUnitRequestsThunk());
  }, [unitsLoading, dispatch]);

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
      void dispatch(fetchChurchDepartmentsThunk());
      void dispatch(fetchDepartmentRequestsThunk());
    } else if (value === 'units') {
      void dispatch(fetchUserUnitsThunk());
      void dispatch(fetchUnitRequestsThunk());
    }
  };

  const handleJoinDepartment = async (departmentId: string) => {
    const result = await dispatch(joinDepartmentThunk(departmentId));

    if (joinDepartmentThunk.fulfilled.match(result)) {
      void dispatch(fetchDepartmentRequestsThunk());
      dispatch(
        pushNotification({
          type: 'success',
          title: 'Request sent',
          message: result.payload.message || 'Your request to join the department has been sent.',
        }),
      );
    } else if (joinDepartmentThunk.rejected.match(result)) {
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Unable to join department',
          message: (result.payload as string) || 'Unable to join department.',
        }),
      );
    }
  };

  const handleJoinUnit = async (unitId: string) => {
    const result = await dispatch(joinUnitThunk(unitId));

    if (joinUnitThunk.fulfilled.match(result)) {
      void dispatch(fetchUnitRequestsThunk());
      dispatch(
        pushNotification({
          type: 'success',
          title: 'Request sent',
          message: result.payload.message || 'Your request to join the unit has been sent.',
        }),
      );
    } else if (joinUnitThunk.rejected.match(result)) {
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Unable to join unit',
          message: (result.payload as string) || 'Unable to join unit.',
        }),
      );
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
                  <UserProfileImage size="lg" />
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
      <ChurchMembershipGuard>
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
                <div className="relative grid gap-4">
                  {churchDepartmentsLoading && (
                    <div className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-white/80 backdrop-blur-sm">
                      <AppStateFeedback state="loading" label="Loading departments" className="min-h-32" />
                    </div>
                  )}
                  {churchDepartmentsError && !churchDepartments.length && (
                    <AppStateFeedback
                      state="error"
                      title="Unable to load departments"
                      description={churchDepartmentsError}
                      className="min-h-36"
                      onRetry={() => void dispatch(fetchChurchDepartmentsThunk())}
                    />
                  )}
                  {!churchDepartmentsLoading && !churchDepartmentsError && !churchDepartments.length && (
                    <AppStateFeedback
                      state="empty"
                      title="No departments"
                      description="No departments are available at the moment."
                      className="min-h-32"
                    />
                  )}
                  {churchDepartments.map((department) => {
                    const hasPendingRequest = departmentRequests.some(
                      (req) => req.departmentId === department.id && req.status === 'PENDING',
                    );

                    return (
                      <AppCard key={department.id} className="shadow-[0_10px_24px_rgba(11,31,74,0.05)]">
                        <div className="flex items-start justify-between gap-3 p-4">
                          <div className="min-w-0 flex-1">
                            <AppText variant="h6">{department.title}</AppText>
                            <AppText variant="caption" color="textSecondary">
                              {department.description}
                            </AppText>
                          </div>
                          {department.joined ? (
                            <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              Joined
                            </span>
                          ) : hasPendingRequest ? (
                            <span className="inline-flex shrink-0 items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                              Pending
                            </span>
                          ) : (
                            <AppButton
                              size="sm"
                              loading={joiningDepartmentId === department.id}
                              disabled={joiningDepartmentId !== null}
                              onClick={() => void handleJoinDepartment(department.id)}
                            >
                              Join
                            </AppButton>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 px-4 pb-4">
                          <span className="rounded-full bg-[#EEF4FF] px-2 py-1 text-xs font-semibold text-[#123B8D]">
                            Department
                          </span>
                        </div>
                      </AppCard>
                    );
                  })}
                </div>
              )}

              {activeTab === 'units' && (
                <div className="relative grid gap-4">
                  {unitsLoading && (
                    <div className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-white/80 backdrop-blur-sm">
                      <AppStateFeedback state="loading" label="Loading units" className="min-h-32" />
                    </div>
                  )}
                  {unitsError && !units.length && (
                    <AppStateFeedback
                      state="error"
                      title="Unable to load units"
                      description={unitsError}
                      className="min-h-36"
                      onRetry={() => void dispatch(fetchUserUnitsThunk())}
                    />
                  )}
                  {!unitsLoading && !unitsError && !units.length && (
                    <AppStateFeedback
                      state="empty"
                      title="No units"
                      description="No units are available at the moment."
                      className="min-h-32"
                    />
                  )}
                  {units.map((unit) => {
                    const hasPendingRequest = unitRequests.some(
                      (req) => req.unitId === unit.id && req.status === 'PENDING',
                    );

                    return (
                      <AppCard key={unit.id} className="shadow-[0_10px_24px_rgba(11,31,74,0.05)]">
                        <div className="flex items-start justify-between gap-3 p-4">
                          <div className="min-w-0 flex-1">
                            <AppText variant="h6">{unit.title}</AppText>
                            <AppText variant="caption" color="textSecondary">
                              {unit.description}
                            </AppText>
                          </div>
                          {unit.joined ? (
                            <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              Joined
                            </span>
                          ) : hasPendingRequest ? (
                            <span className="inline-flex shrink-0 items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                              Pending
                            </span>
                          ) : (
                            <AppButton
                              size="sm"
                              loading={joiningUnitId === unit.id}
                              disabled={joiningUnitId !== null}
                              onClick={() => void handleJoinUnit(unit.id)}
                            >
                              Join
                            </AppButton>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 px-4 pb-4">
                          <span className="rounded-full bg-[#EEF4FF] px-2 py-1 text-xs font-semibold text-[#123B8D]">
                            Unit
                          </span>
                        </div>
                      </AppCard>
                    );
                  })}
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
      </ChurchMembershipGuard>
    </AppShell>
  );
};

export default ForumPage;
