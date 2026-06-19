import { useEffect, useState } from 'react';
import {
  Church,
  Shield,
  Clock,
  Sparkles,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { AppScrollableTabs, AppText } from '@/components/common';
import { AppButton } from '@/components/common';
import { AppCard } from '@/components/display';
import { ChurchMembershipGuard } from '@/components/guards';
import { AppShell } from '@/layouts/AppShell';
import { AppStateFeedback } from '@/components/feedback';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearChurchMinistriesError,
  clearMyMinistriesError,
} from '@/store/slices/ministrySlice';
import {
  fetchChurchMinistriesThunk,
  fetchMyMinistriesThunk,
  requestToJoinMinistryThunk,
  cancelMinistryRequestThunk,
} from '@/store/thunks/ministryThunk';
import type { ChurchMinistry, MyMinistry } from '@/types/ministry';

const tabItems = [
  { value: 'my', label: 'My Ministry' },
  { value: 'church', label: 'Church Ministries' },
] as const;

type MinistryTab = (typeof tabItems)[number]['value'];

const roleBadgeColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'bg-[#D4A017]/15 text-[#8A6500]';
    case 'leader':
      return 'bg-[#123B8D]/10 text-[#123B8D]';
    default:
      return 'bg-[#E5E7EB] text-[#5A6880]';
  }
};

const statusBadgeColor = (joined: boolean) =>
  joined
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : 'bg-[#EEF4FF] text-[#123B8D] border border-[#D6DEEB]';

const MyMinistryCard = ({ ministry, index }: { ministry: MyMinistry; index: number }) => (
  <div
    className="animate-slide-up opacity-0"
    style={{ animationDelay: `${index * 80}ms` }}
  >
    <AppCard className="shadow-[0_4px_12px_rgba(11,31,74,0.08)] hover:shadow-[0_8px_20px_rgba(11,31,74,0.14)] transition-all duration-300 hover:-translate-y-0.5">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#EAF1FF] text-[#123B8D]">
              <Church className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 grid gap-1">
              <AppText variant="h6" className="line-clamp-1">{ministry.name}</AppText>
              <AppText variant="caption" color="textMuted">
                {ministry.slug}
              </AppText>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadgeColor(ministry.role)}`}>
            <Shield className="size-3" aria-hidden />
            {ministry.role}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FDF4 px-2.5 py-1 text-xs font-medium text-[#166534]">
            <Clock className="size-3" aria-hidden />
            Joined {new Date(ministry.joinedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </AppCard>
  </div>
);

const ChurchMinistryCard = ({
  ministry,
  index,
  onJoin,
  onCancel,
  isJoining,
  isCancelling,
}: {
  ministry: ChurchMinistry;
  index: number;
  onJoin: (ministryId: string) => void;
  onCancel: (ministryId: string, requestId: string) => void;
  isJoining: boolean;
  isCancelling: boolean;
}) => (
  <div
    className="animate-slide-up opacity-0"
    style={{ animationDelay: `${index * 80}ms` }}
  >
    <AppCard className="shadow-[0_4px_12px_rgba(11,31,74,0.08)] hover:shadow-[0_8px_20px_rgba(11,31,74,0.14)] transition-all duration-300 hover:-translate-y-0.5">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${
              ministry.joined ? 'bg-emerald-50 text-emerald-600' : 'bg-[#EAF1FF] text-[#123B8D]'
            }`}>
              <Church className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 grid gap-1">
              <AppText variant="h6" className="line-clamp-1">{ministry.name}</AppText>
              <AppText variant="caption" color="textSecondary" className="line-clamp-2">
                {ministry.description}
              </AppText>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeColor(ministry.joined)}`}>
              {ministry.joined ? 'Joined' : 'Available'}
            </span>
            {ministry.membership && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadgeColor(ministry.membership.role)}`}>
                <Shield className="size-3" aria-hidden />
                {ministry.membership.role}
              </span>
            )}
            {ministry.hasPendingRequest && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                <Clock className="size-3" aria-hidden />
                Pending
              </span>
            )}
          </div>
          {!ministry.joined && !ministry.hasPendingRequest && (
            <AppButton
              size="sm"
              leftIcon={<UserPlus className="size-3.5" aria-hidden />}
              loading={isJoining}
              onClick={() => onJoin(ministry.ministryId)}
            >
              Join
            </AppButton>
          )}
          {ministry.hasPendingRequest && ministry.pendingRequest && (
            <AppButton
              size="sm"
              variant="secondary"
              leftIcon={<UserMinus className="size-3.5" aria-hidden />}
              loading={isCancelling}
              onClick={() => onCancel(ministry.ministryId, ministry.pendingRequest!.id)}
            >
              Cancel
            </AppButton>
          )}
        </div>
      </div>
    </AppCard>
  </div>
);

export default function MinistryPage() {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<MinistryTab>('my');

  const {
    myMinistries,
    myMinistriesLoaded,
    myMinistriesLoading,
    myMinistriesError,
    churchMinistries,
    churchMinistriesLoaded,
    churchMinistriesLoading,
    churchMinistriesError,
    joinRequestLoading,
    cancelRequestLoading,
  } = useAppSelector((state) => state.ministry);

  useEffect(() => {
    if (activeTab === 'my' && !myMinistriesLoaded && !myMinistriesLoading && !myMinistriesError) {
      void dispatch(fetchMyMinistriesThunk());
    }
    if (activeTab === 'church' && !churchMinistriesLoaded && !churchMinistriesLoading && !churchMinistriesError) {
      void dispatch(fetchChurchMinistriesThunk());
    }
  }, [activeTab, myMinistriesLoaded, myMinistriesLoading, myMinistriesError, churchMinistriesLoaded, churchMinistriesLoading, churchMinistriesError, dispatch]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as MinistryTab);
  };

  const handleRetry = () => {
    if (activeTab === 'my') {
      dispatch(clearMyMinistriesError());
      void dispatch(fetchMyMinistriesThunk());
    } else {
      dispatch(clearChurchMinistriesError());
      void dispatch(fetchChurchMinistriesThunk());
    }
  };

  const handleJoinMinistry = (ministryId: string) => {
    dispatch(requestToJoinMinistryThunk(ministryId));
  };

  const handleCancelRequest = (ministryId: string, requestId: string) => {
    dispatch(cancelMinistryRequestThunk({ ministryId, requestId }));
  };

  const isLoading = activeTab === 'my' ? myMinistriesLoading : churchMinistriesLoading;
  const error = activeTab === 'my' ? myMinistriesError : churchMinistriesError;
  const items = activeTab === 'my' ? myMinistries : churchMinistries;

  return (
    <AppShell
      mobileHeaderAddon={
        <div className="min-w-0 bg-white/95 backdrop-blur-xl">
          <div className="min-w-0 border-b border-[#E5E7EB]">
            <div className="mx-auto max-w-[78rem] px-4 py-5 sm:px-6 md:px-9">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#123B8D] to-[#0B1F4A] text-white shadow-[0_4px_12px_rgba(18,59,141,0.3)]">
                  <Sparkles className="size-5" aria-hidden />
                </span>
                <div className="grid gap-0.5">
                  <AppText variant="h5" className="font-bold text-[#0B1F4A]">
                    Ministries
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    Connect with your church ministries
                  </AppText>
                </div>
              </div>
            </div>

            <div className="mx-auto max-w-[78rem]">
              <AppScrollableTabs
                tabs={tabItems.map((item) => ({ value: item.value, label: item.label }))}
                value={activeTab}
                onValueChange={handleTabChange}
                ariaLabel="Ministry navigation tabs"
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
          {isLoading && !items.length && (
            <AppStateFeedback state="loading" label="Loading ministries" className="min-h-44" />
          )}

          {error && !items.length && !isLoading && (
            <AppStateFeedback
              state="error"
              title="Unable to load ministries"
              description={error}
              className="min-h-44"
              onRetry={handleRetry}
            />
          )}

          {!isLoading && !error && !items.length && (
            <AppStateFeedback
              state="empty"
              title={activeTab === 'my' ? 'No ministries yet' : 'No ministries available'}
              description={
                activeTab === 'my'
                  ? "You haven't joined any ministries yet. Browse church ministries to get started."
                  : 'No ministries have been created for this church yet.'
              }
              className="min-h-44"
            />
          )}

          {!isLoading && !error && items.length > 0 && (
            <div className="grid gap-4 animate-fade-in">
              {activeTab === 'my' &&
                myMinistries.map((ministry, index) => (
                  <MyMinistryCard key={ministry.ministryId} ministry={ministry} index={index} />
                ))}

              {activeTab === 'church' &&
                churchMinistries.map((ministry, index) => (
                  <ChurchMinistryCard
                    key={ministry.ministryId}
                    ministry={ministry}
                    index={index}
                    onJoin={handleJoinMinistry}
                    onCancel={handleCancelRequest}
                    isJoining={joinRequestLoading === ministry.ministryId}
                    isCancelling={cancelRequestLoading === ministry.ministryId}
                  />
                ))}
            </div>
          )}
        </section>
      </main>
      </ChurchMembershipGuard>
    </AppShell>
  );
}
