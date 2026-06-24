import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Plus, Search, X, Check, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppButton, AppScrollableTabs, AppText } from '@/components/common';
import { AppCard } from '@/components/display';
import { AppLoader, AppStateFeedback } from '@/components/feedback';
import { AppShell } from '@/layouts/AppShell';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchDepartmentMembersThunk,
  fetchChurchMembersThunk,
  addDepartmentMemberThunk,
} from '@/store/slices/forumSlice';
import { pushNotification } from '@/store/slices/notificationSlice';
import type { ChurchMember } from '@/store/slices/forumSlice';

const tabItems = [
  { value: 'members', label: 'Members' },
  { value: 'units', label: 'Units' },
] as const;

type DepartmentTab = (typeof tabItems)[number]['value'];

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

const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

const roleOptions = ['member', 'moderator', 'admin'] as const;

export default function DepartmentDetailsPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<DepartmentTab>('members');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<ChurchMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('member');
  const [memberPage, setMemberPage] = useState(1);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const churchDetails = useAppSelector((state) => state.church.details);
  const myDepartments = useAppSelector((state) => state.forum.myDepartments);
  const {
    departmentMembers,
    departmentMembersLoading,
    departmentMembersError,
    departmentMembersMeta,
    departmentMembersLoadingMore,
    churchMembers,
    churchMembersLoading,
    churchMembersError,
    churchMembersMeta,
    churchMembersLoadingMore,
    addMemberLoading,
  } = useAppSelector((state) => state.forum);

  const myMembership = myDepartments.find((d) => d.departmentId === departmentId);
  const isAdmin = myMembership?.role === 'admin';

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!departmentId || hasFetched.current) return;
    hasFetched.current = true;
    void dispatch(fetchDepartmentMembersThunk({ departmentId, page: 1, limit: 20 }));
  }, [departmentId, dispatch]);

  const loadMoreMembers = useCallback(() => {
    if (!departmentId || departmentMembersLoadingMore) return;
    if (!departmentMembersMeta) return;
    const nextPage = departmentMembersMeta.page + 1;
    if (nextPage > departmentMembersMeta.pages) return;
    void dispatch(fetchDepartmentMembersThunk({ departmentId, page: nextPage, limit: 20 }));
  }, [departmentId, departmentMembersMeta, departmentMembersLoadingMore, dispatch]);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || activeTab !== 'members') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          loadMoreMembers();
        }
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, loadMoreMembers]);

  const fetchChurchMembers = useCallback(
    (page: number, search?: string) => {
      if (!churchDetails?.id) return;
      void dispatch(fetchChurchMembersThunk({ churchId: churchDetails.id, page, limit: 20, search }));
    },
    [dispatch, churchDetails?.id],
  );

  const handleOpenModal = () => {
    setSelectedMember(null);
    setSelectedRole('member');
    setSearchQuery('');
    setMemberPage(1);
    setShowModal(true);
    fetchChurchMembers(1);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setMemberPage(1);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchChurchMembers(1, value || undefined);
    }, 400);
  };

  const loadMoreChurchMembers = useCallback(() => {
    if (churchMembersLoadingMore) return;
    if (!churchMembersMeta) return;
    const nextPage = churchMembersMeta.page + 1;
    if (nextPage > churchMembersMeta.totalPages) return;
    setMemberPage(nextPage);
    fetchChurchMembers(nextPage, searchQuery || undefined);
  }, [churchMembersLoadingMore, churchMembersMeta, fetchChurchMembers, searchQuery]);

  const modalSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = modalSentinelRef.current;
    if (!sentinel || !showModal) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          loadMoreChurchMembers();
        }
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [showModal, loadMoreChurchMembers]);

  const handleAddMember = async () => {
    if (!departmentId || !selectedMember) return;
    const result = await dispatch(
      addDepartmentMemberThunk({ departmentId, memberId: selectedMember.id, role: selectedRole }),
    );
    if (addDepartmentMemberThunk.fulfilled.match(result)) {
      dispatch(
        pushNotification({
          type: 'success',
          title: 'Member added',
          message: `${selectedMember.displayName} has been added to the department.`,
        }),
      );
      setShowModal(false);
      hasFetched.current = false;
      void dispatch(fetchDepartmentMembersThunk({ departmentId, page: 1, limit: 20 }));
    } else if (addDepartmentMemberThunk.rejected.match(result)) {
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Unable to add member',
          message: (result.payload as string) || 'Unable to add member to department.',
        }),
      );
    }
  };

  const renderMembers = () => {
    if (departmentMembersLoading && !departmentMembers.length) {
      return <AppLoader label="Loading members" className="min-h-44" />;
    }

    if (departmentMembersError && !departmentMembers.length) {
      return (
        <AppStateFeedback
          state="error"
          title="Unable to load members"
          description={departmentMembersError}
          className="min-h-44"
          onRetry={() => {
            if (departmentId) {
              hasFetched.current = false;
              void dispatch(fetchDepartmentMembersThunk({ departmentId, page: 1, limit: 20 }));
            }
          }}
        />
      );
    }

    if (!departmentMembers.length && !departmentMembersLoading) {
      return (
        <AppStateFeedback
          state="empty"
          title="No members"
          description="No members have joined this department yet."
          className="min-h-44"
        />
      );
    }

    return (
      <div className="grid gap-3">
        {departmentMembers.map((member, index) => (
          <div
            key={member.memberId}
            className="animate-slide-up opacity-0"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <AppCard className="shadow-[0_4px_12px_rgba(11,31,74,0.08)]">
              <div className="flex items-center gap-3 p-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#EAF1FF] text-xs font-semibold text-[#123B8D]">
                  {getInitials(member.displayName)}
                </span>
                <div className="min-w-0 flex-1">
                  <AppText variant="bodyMedium" weight="semibold" className="line-clamp-1">
                    {member.displayName}
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </AppText>
                </div>
                <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadgeColor(member.role)}`}>
                  {member.role}
                </span>
              </div>
            </AppCard>
          </div>
        ))}

        <div ref={sentinelRef} className="grid min-h-12 place-items-center">
          {departmentMembersLoadingMore && <AppLoader label="Loading more" />}
          {departmentMembersMeta && departmentMembersMeta.page >= departmentMembersMeta.pages && departmentMembers.length > 0 && (
            <AppText variant="caption" color="textMuted">
              All members loaded
            </AppText>
          )}
        </div>
      </div>
    );
  };

  const renderUnits = () => (
    <AppStateFeedback
      state="empty"
      title="Coming soon"
      description="Department units will be available here."
      className="min-h-44"
    />
  );

  return (
    <AppShell>
      <div className="mx-auto grid gap-5 px-4 pb-28 pt-3 sm:px-6 md:px-9">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EAF1FF] text-[#123B8D] transition-colors hover:bg-[#D9E4F6]"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <div className="grid min-w-0 gap-1">
            <AppText variant="h4">Department Details</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              View members and units
            </AppText>
          </div>
        </header>

        <AppScrollableTabs
          tabs={tabItems.map((item) => ({ value: item.value, label: item.label }))}
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as DepartmentTab)}
          ariaLabel="Department tabs"
          fullWidthTabs
        />

        {activeTab === 'members' && renderMembers()}
        {activeTab === 'units' && renderUnits()}
      </div>

      {isAdmin && (
        <button
          type="button"
          onClick={handleOpenModal}
          className="fixed bottom-24 right-5 z-40 grid size-14 place-items-center rounded-full bg-[#123B8D] text-white shadow-[0_6px_20px_rgba(18,59,141,0.4)] transition-transform hover:scale-105 active:scale-95 sm:right-8"
          aria-label="Add member"
        >
          <Plus className="size-6" aria-hidden />
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <header className="flex items-center gap-3 border-b border-[#E5E7EB] px-4 py-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="grid size-9 shrink-0 place-items-center rounded-lg hover:bg-slate-100"
            >
              <X className="size-5" aria-hidden />
            </button>
            <AppText variant="h6">Add Member</AppText>
          </header>

          <div className="px-4 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
              <Search className="size-4 shrink-0 text-slate-400" aria-hidden />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {selectedMember && (
            <div className="border-b border-[#E5E7EB] px-4 py-3">
              <AppText variant="caption" color="textSecondary" className="mb-2">
                Role for {selectedMember.displayName}:
              </AppText>
              <div className="flex gap-2">
                {roleOptions.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selectedRole === role
                        ? 'bg-[#123B8D] text-white'
                        : 'bg-[#E5E7EB] text-[#5A6880] hover:bg-[#D1D5DB]'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {churchMembersLoading && !churchMembers.length && (
              <div className="grid min-h-44 place-items-center">
                <AppLoader label="Loading members" />
              </div>
            )}

            {churchMembersError && !churchMembers.length && (
              <div className="grid min-h-44 place-items-center px-4">
                <AppStateFeedback
                  state="error"
                  title="Unable to load members"
                  description={churchMembersError}
                  className="min-h-32"
                  onRetry={() => fetchChurchMembers(1, searchQuery || undefined)}
                />
              </div>
            )}

            {!churchMembersLoading && !churchMembersError && !churchMembers.length && (
              <div className="grid min-h-44 place-items-center px-4">
                <AppStateFeedback
                  state="empty"
                  title="No members found"
                  description="Try a different search term."
                  className="min-h-32"
                />
              </div>
            )}

            {churchMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
                className={`flex w-full items-center gap-3 border-b border-[#F3F4F6] px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                  selectedMember?.id === member.id ? 'bg-[#EEF4FF]' : ''
                }`}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#EAF1FF] text-xs font-semibold text-[#123B8D]">
                  {getInitials(member.displayName)}
                </span>
                <div className="min-w-0 flex-1">
                  <AppText variant="bodyMedium" weight="semibold" className="line-clamp-1">
                    {member.displayName}
                  </AppText>
                </div>
                {selectedMember?.id === member.id && (
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#123B8D] text-white">
                    <Check className="size-4" aria-hidden />
                  </span>
                )}
              </button>
            ))}

            <div ref={modalSentinelRef} className="grid min-h-10 place-items-center">
              {churchMembersLoadingMore && <AppLoader label="Loading more" />}
            </div>
          </div>

          <div className="border-t border-[#E5E7EB] px-4 py-3">
            <AppButton
              fullWidth
              disabled={!selectedMember || addMemberLoading}
              loading={addMemberLoading}
              onClick={handleAddMember}
            >
              {addMemberLoading ? 'Adding...' : 'Add to Department'}
            </AppButton>
          </div>
        </div>
      )}
    </AppShell>
  );
}
