import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { CheckCircle2, Clock3, LogOut, Mail, Plus, Send, UserPlus, Users, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppScrollableTabs, AppText } from '@/components/common';
import { AppAvatar } from '@/components/display';
import { ChurchMembershipGuard } from '@/components/guards';
import { AppModal, AppStateFeedback } from '@/components/feedback';
import { AppDropdown, AppInput } from '@/components/form';
import { AppShell } from '@/layouts/AppShell';
import { familyInviteService } from '@/pages/profile/services/familyInviteService';
import type {
  FamilyLinkRequest,
  FamilyMemberSearchItem,
  FamilyRelationship,
  UserFamilyInvitation,
  UserFamilyMember,
  UserFamilyResponse,
} from '@/pages/profile/types/familyInviteTypes';
import { paths } from '@/routes/paths';
import { useAppDispatch } from '@/store/hooks';
import { pushNotification } from '@/store/slices/notificationSlice';
import { formatDate } from '@/utils/formatDate';

type FamilyRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'SENT';
type FamilyRequestTab = 'sent' | 'incoming';
type FamilyRequestAction = 'accept' | 'reject';

interface FamilyRequestListItem {
  id: string;
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
  relationship: string;
  contact?: string;
  message?: string | null;
  status: FamilyRequestStatus;
  direction: 'incoming' | 'outgoing';
  sentAt: string;
}

const defaultMessage = 'Please join BaptistOne so we can complete our family profile.';

const statusClasses: Record<FamilyRequestStatus, string> = {
  ACCEPTED: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  CANCELLED: 'border-slate-200 bg-slate-50 text-slate-600',
  PENDING: 'border-amber-100 bg-amber-50 text-amber-700',
  REJECTED: 'border-red-100 bg-red-50 text-red-700',
  SENT: 'border-[#EAF1FF] bg-[#EAF1FF] text-[#123B8D]',
};

const requestTabs: Array<{ value: FamilyRequestTab; label: string }> = [
  { value: 'sent', label: 'Request sent' },
  { value: 'incoming', label: 'Incoming request' },
];

const relationshipOptions: Array<{
  value: FamilyRelationship;
  label: string;
  description: string;
}> = [
  { value: 'SPOUSE', label: 'Spouse', description: 'Link as your husband or wife.' },
  { value: 'CHILD', label: 'Child', description: 'Link as a child in your family.' },
  { value: 'DEPENDANT', label: 'Dependant', description: 'Link as someone you care for.' },
  { value: 'OTHER', label: 'Other', description: 'Link with another family relationship.' },
];

const getMemberName = (member: FamilyMemberSearchItem) =>
  member.displayName?.trim() || member.username?.trim() || member.email?.trim() || 'Member';

const getMemberEmail = (member: FamilyMemberSearchItem) =>
  member.contactEmail?.trim() || member.email?.trim() || '';

const getMemberPhone = (member: FamilyMemberSearchItem) => member.contactPhone?.trim() || '';

const getRelationshipLabel = (relationship: FamilyRelationship) =>
  relationshipOptions.find((option) => option.value === relationship)?.label ?? relationship;

const formatRequestDate = (value: string) => {
  try {
    return formatDate(value);
  } catch {
    return value;
  }
};

const normalizeRequestStatus = (status: string): FamilyRequestStatus =>
  status in statusClasses ? (status as FamilyRequestStatus) : 'PENDING';

const normalizeLinkRequest = (request: FamilyLinkRequest): FamilyRequestListItem => ({
  id: request.id,
  name: request.requesterName?.trim() || request.requesterUsername?.trim() || 'Family member',
  username: request.requesterUsername,
  avatarUrl: request.requesterAvatarUrl,
  relationship: getRelationshipLabel(request.relationship),
  contact: request.requesterUsername ?? undefined,
  message: request.message,
  status: request.status,
  direction: 'incoming',
  sentAt: formatRequestDate(request.createdAt),
});

const normalizeFamilyInvitation = (invitation: UserFamilyInvitation): FamilyRequestListItem => ({
  id: invitation.id,
  name: invitation.invitedName?.trim() || invitation.invitedEmail?.trim() || 'Invited member',
  relationship: getRelationshipLabel(invitation.relationship),
  contact: [invitation.invitedEmail, invitation.invitedPhone].filter(Boolean).join(' - '),
  message: invitation.message,
  status: normalizeRequestStatus(invitation.status),
  direction: 'outgoing',
  sentAt: formatRequestDate(invitation.sentAt || invitation.createdAt),
});

const getFamilyMemberName = (member: UserFamilyMember) =>
  member.displayName?.trim() || member.username?.trim() || member.email?.trim() || 'Family member';

const getFamilyMemberContact = (member: UserFamilyMember) =>
  [member.contactEmail || member.email, member.contactPhone].filter(Boolean).join(' - ');

const httpStatusMessages: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'You are not logged in. Please sign in and try again.',
  403: 'You do not have permission to access this resource.',
  404: 'Family profile not found. It may not have been set up yet.',
  409: 'This action conflicts with the current state. Please refresh and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our end. Please try again later.',
  502: 'Service temporarily unavailable. Please try again later.',
  503: 'Service temporarily unavailable. Please try again later.',
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const errObj = error as { message?: unknown; response?: { status?: number; data?: { message?: string } }; status?: number };

    if (errObj.response?.data?.message && typeof errObj.response.data.message === 'string') {
      return errObj.response.data.message;
    }

    const status = errObj.response?.status ?? errObj.status;
    if (typeof status === 'number' && httpStatusMessages[status]) {
      return httpStatusMessages[status];
    }

    if (typeof errObj.message === 'string' && errObj.message.trim()) {
      return errObj.message;
    }
  }

  return fallback;
};

const FamilyPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FamilyMemberSearchItem[]>([]);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMemberSearchItem | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<FamilyRelationship>('SPOUSE');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkedMemberIds, setLinkedMemberIds] = useState<string[]>([]);
  const [familyData, setFamilyData] = useState<NonNullable<UserFamilyResponse['data']> | null>(
    null,
  );
  const [familyLoading, setFamilyLoading] = useState(false);
  const [familyError, setFamilyError] = useState<string | null>(null);
  const [linkRequests, setLinkRequests] = useState<FamilyRequestListItem[]>([]);
  const [localRequests, setLocalRequests] = useState<FamilyRequestListItem[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [activeRequestTab, setActiveRequestTab] = useState<FamilyRequestTab>('sent');
  const [requestActionLoading, setRequestActionLoading] = useState<{
    id: string;
    action: FamilyRequestAction;
  } | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [manualRelationship, setManualRelationship] = useState<FamilyRelationship>('SPOUSE');
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualMessage, setManualMessage] = useState(defaultMessage);
  const [manualInviteLoading, setManualInviteLoading] = useState(false);
  const [manualInviteError, setManualInviteError] = useState<string | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const trimmedSearchQuery = searchQuery.trim();
  const familyMembers = familyData?.members ?? [];
  const familyName = familyData?.family?.name ?? 'Your family';
  const familyInvitations = useMemo(
    () => (familyData?.invitations ?? []).map(normalizeFamilyInvitation),
    [familyData?.invitations],
  );
  const sentRequests = useMemo(
    () => [...localRequests, ...familyInvitations],
    [familyInvitations, localRequests],
  );
  const incomingRequests = linkRequests;
  const requests = useMemo(
    () => [...sentRequests, ...incomingRequests],
    [incomingRequests, sentRequests],
  );
  const activeRequests = activeRequestTab === 'sent' ? sentRequests : incomingRequests;
  const previewFamilyMembers = familyMembers.slice(0, 1);
  const previewRequests = activeRequests.slice(0, 1);
  const activeRequestsLoading = activeRequestTab === 'sent' ? familyLoading : requestsLoading;
  const activeRequestsError = activeRequestTab === 'sent' ? familyError : requestsError;
  const activeEmptyTitle =
    activeRequestTab === 'sent' ? 'No sent requests' : 'No incoming requests';
  const activeEmptyDescription =
    activeRequestTab === 'sent'
      ? 'Family invitations you send will appear here.'
      : 'Family link requests sent to you will appear here.';
  const pendingRequests = requests.filter(
    (request) => request.status === 'PENDING' || request.status === 'SENT',
  ).length;
  const canSendManualRequest = Boolean(
    manualName.trim() && (manualEmail.trim() || manualPhone.trim()),
  );
  const selectedMemberName = selectedMember ? getMemberName(selectedMember) : '';
  const selectedMemberContact = selectedMember
    ? [getMemberEmail(selectedMember), getMemberPhone(selectedMember)].filter(Boolean).join(' - ')
    : '';
  const searchStatusMessage = useMemo(() => {
    if (!trimmedSearchQuery) return 'Search by name, email, username, or phone.';
    if (searchLoading) return 'Searching family members...';
    if (searchError) return searchError;
    if (!searchResults.length) return 'No member found for your search.';
    return null;
  }, [searchError, searchLoading, searchResults.length, trimmedSearchQuery]);
  const showSearchPanel = isSearchPanelOpen && Boolean(trimmedSearchQuery || searchResults.length);

  const fetchFamily = useCallback(async () => {
    setFamilyLoading(true);
    setFamilyError(null);

    try {
      const response = await familyInviteService.getFamily();
      setFamilyData(response.data ?? null);
    } catch (error) {
      setFamilyError(getErrorMessage(error, 'Unable to load family.'));
    } finally {
      setFamilyLoading(false);
    }
  }, []);

  const fetchFamilyRequests = useCallback(async () => {
    setRequestsLoading(true);
    setRequestsError(null);

    try {
      const response = await familyInviteService.listLinkRequests();
      setLinkRequests((response.data?.items ?? []).map(normalizeLinkRequest));
    } catch (error) {
      setRequestsError(getErrorMessage(error, 'Unable to load family requests.'));
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchFamily();
      void fetchFamilyRequests();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchFamily, fetchFamilyRequests]);

  useEffect(() => {
    if (!trimmedSearchQuery) return;

    const abortController = new AbortController();
    const debounceTimer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);

      try {
        const response = await familyInviteService.searchMembers(trimmedSearchQuery, {
          signal: abortController.signal,
        });
        setSearchResults(response.data?.items ?? []);
      } catch (error) {
        if (abortController.signal.aborted) return;

        setSearchResults([]);
        setSearchError(getErrorMessage(error, 'Unable to search family members.'));
      } finally {
        if (!abortController.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 350);

    return () => {
      abortController.abort();
      window.clearTimeout(debounceTimer);
    };
  }, [trimmedSearchQuery]);

  useEffect(() => {
    if (!isSearchPanelOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const searchContainer = searchContainerRef.current;

      if (!searchContainer || searchContainer.contains(event.target as Node)) return;

      setIsSearchPanelOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isSearchPanelOpen]);

  const addRequest = ({
    name,
    contact,
    relationship = 'Spouse',
    status = 'SENT',
    message,
    notify = true,
  }: {
    name: string;
    contact: string;
    relationship?: string;
    status?: FamilyRequestStatus;
    message?: string;
    notify?: boolean;
  }) => {
    setLocalRequests((current) => [
      {
        id: `request-${Date.now()}`,
        name,
        relationship,
        contact,
        message,
        status,
        direction: 'outgoing',
        sentAt: 'Just now',
      },
      ...current,
    ]);

    if (notify) {
      dispatch(
        pushNotification({
          type: 'success',
          title: 'Family invite sent',
          message: `Family request sent to ${name}.`,
        }),
      );
    }
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;

    setSearchQuery(nextQuery);
    setLinkError(null);
    setIsSearchPanelOpen(Boolean(nextQuery.trim()));

    if (!nextQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
    }
  };

  const openRelationshipModal = (member: FamilyMemberSearchItem) => {
    setSelectedMember(member);
    setSelectedRelationship('SPOUSE');
    setLinkError(null);
    setIsSearchPanelOpen(false);
  };

  const closeRelationshipModal = () => {
    if (linking) return;

    setSelectedMember(null);
    setLinkError(null);
  };

  const openInviteModal = () => {
    setManualInviteError(null);
    setIsInviteModalOpen(true);
  };

  const closeInviteModal = () => {
    if (manualInviteLoading) return;

    setIsInviteModalOpen(false);
    setManualInviteError(null);
  };

  const handleLinkMember = async () => {
    if (!selectedMember) return;

    setLinking(true);
    setLinkError(null);

    try {
      const response = await familyInviteService.linkMember({
        targetMemberId: selectedMember.memberId,
        relationship: selectedRelationship,
      });
      setLinkedMemberIds((current) =>
        current.includes(selectedMember.memberId) ? current : [...current, selectedMember.memberId],
      );
      addRequest({
        name: getMemberName(selectedMember),
        contact: selectedMemberContact || 'Linked member',
        relationship: getRelationshipLabel(selectedRelationship),
        status: 'ACCEPTED',
        notify: false,
      });
      dispatch(
        pushNotification({
          type: 'success',
          title: 'Family member linked',
          message:
            response.message ||
            `${getMemberName(selectedMember)} has been linked as ${selectedRelationship.toLowerCase()}.`,
        }),
      );
      setSelectedMember(null);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to link family member.');
      setLinkError(message);
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Unable to link family member',
          message,
        }),
      );
    } finally {
      setLinking(false);
    }
  };

  const handleIncomingRequestAction = async (
    request: FamilyRequestListItem,
    action: FamilyRequestAction,
  ) => {
    setRequestActionLoading({ id: request.id, action });

    try {
      const response =
        action === 'accept'
          ? await familyInviteService.acceptInvitation(request.id)
          : await familyInviteService.rejectInvitation(request.id);
      const nextStatus: FamilyRequestStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED';

      setLinkRequests((current) =>
        current.map((item) => (item.id === request.id ? { ...item, status: nextStatus } : item)),
      );
      dispatch(
        pushNotification({
          type: 'success',
          title: action === 'accept' ? 'Request accepted' : 'Request rejected',
          message:
            response.message ||
            (action === 'accept'
              ? `${request.name} has been accepted.`
              : `${request.name} has been rejected.`),
        }),
      );
    } catch (error) {
      const message = getErrorMessage(
        error,
        action === 'accept' ? 'Unable to accept request.' : 'Unable to reject request.',
      );

      dispatch(
        pushNotification({
          type: 'error',
          title: action === 'accept' ? 'Unable to accept request' : 'Unable to reject request',
          message,
        }),
      );
    } finally {
      setRequestActionLoading(null);
    }
  };

  const handleManualInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSendManualRequest) return;

    const name = manualName.trim();
    const email = manualEmail.trim();
    const phone = manualPhone.trim();
    const message = manualMessage.trim() || defaultMessage;

    setManualInviteLoading(true);
    setManualInviteError(null);

    try {
      const response = await familyInviteService.inviteMember({
        relationship: manualRelationship,
        name,
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        message,
      });

      addRequest({
        name,
        contact: email || phone,
        relationship: getRelationshipLabel(manualRelationship),
        message,
        notify: false,
      });
      dispatch(
        pushNotification({
          type: 'success',
          title: 'Family invite sent',
          message: response.message || `Family request sent to ${name}.`,
        }),
      );
      setManualName('');
      setManualEmail('');
      setManualPhone('');
      setManualMessage(defaultMessage);
      setManualRelationship('SPOUSE');
      setIsInviteModalOpen(false);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to send invite.');
      setManualInviteError(message);
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Unable to send invite',
          message,
        }),
      );
    } finally {
      setManualInviteLoading(false);
    }
  };

  const openLeaveModal = () => {
    setLeaveReason('');
    setLeaveError(null);
    setIsLeaveModalOpen(true);
  };

  const closeLeaveModal = () => {
    if (leaveLoading) return;

    setIsLeaveModalOpen(false);
    setLeaveError(null);
  };

  const handleLeaveFamily = async () => {
    setLeaveLoading(true);
    setLeaveError(null);

    try {
      const response = await familyInviteService.leaveFamily({
        note: leaveReason.trim() || 'No longer part of this family group.',
        maritalStatus: 'divorced',
        marritalStatus: 'divorced',
      });

      dispatch(
        pushNotification({
          type: 'success',
          title: 'Left family',
          message: response.message || 'You have left the family group.',
        }),
      );

      setIsLeaveModalOpen(false);
      setFamilyData(null);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to leave family.');
      setLeaveError(message);
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Unable to leave family',
          message,
        }),
      );
    } finally {
      setLeaveLoading(false);
    }
  };

  return (
    <AppShell>
      <ChurchMembershipGuard>
        <main className="mx-auto grid max-w-[78rem] gap-5 px-4 py-6 pb-28 sm:px-6 md:px-9">
        <section className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(11,31,74,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <div className="grid min-w-0 gap-1">
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#EAF1FF] text-[#123B8D]">
                  <Users className="size-5" aria-hidden />
                </span>
                <AppText variant="h5" className="min-w-0 truncate">
                  Family
                </AppText>
              </div>
              <AppText variant="bodySmall" color="textSecondary" lineClamp={2}>
                Connect and manage your family profile.
              </AppText>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700">
              <Clock3 className="size-3.5" aria-hidden />
              {pendingRequests} pending
            </span>
          </div>
        </section>

        <section className="grid gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_18px_rgba(11,31,74,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AppText variant="h6">{familyName}</AppText>
              <span className="inline-flex items-center rounded-full bg-[#EAF1FF] px-2 py-0.5 text-[0.6875rem] font-bold text-[#123B8D]">
                {familyMembers.length} members
              </span>
            </div>
          </div>
          <AppText variant="bodySmall" color="textSecondary">
            Family members linked to your profile.
          </AppText>
          {familyMembers.length > 0 && (
            <div className="flex items-center gap-2">
              <AppButton size="sm" onClick={() => navigate(paths.familyMembers)}>
                View all
              </AppButton>
              <AppButton
                size="sm"
                variant="secondary"
                leftIcon={<LogOut className="size-3.5" aria-hidden />}
                onClick={openLeaveModal}
              >
                Leave family
              </AppButton>
            </div>
          )}

          {familyLoading && !familyMembers.length && (
            <AppStateFeedback state="loading" label="Loading family" className="min-h-32" />
          )}
          {familyError && !familyMembers.length && (
            <AppStateFeedback
              state="error"
              title="Unable to load family"
              description={familyError}
              retrying={familyLoading}
              className="min-h-36"
              onRetry={() => void fetchFamily()}
            />
          )}
          {!familyLoading && !familyError && !familyMembers.length && (
            <AppStateFeedback
              state="empty"
              title="No family members yet"
              description="Linked family members will appear here."
              className="min-h-32"
            />
          )}
          {familyMembers.length > 0 && (
            <div className="grid gap-2">
              {previewFamilyMembers.map((member) => {
                const name = getFamilyMemberName(member);
                const contact = getFamilyMemberContact(member);

                return (
                  <div
                    className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3"
                    key={member.memberId}
                  >
                    <AppAvatar name={name} src={member.avatarUrl ?? undefined} size="lg" />
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <div className="grid min-w-0 gap-0.5">
                        <span className="truncate text-sm font-bold text-[#0B1F4A]">{name}</span>
                        {contact && (
                          <span className="truncate text-xs text-[#5A6880]">
                            {contact}
                          </span>
                        )}
                        {member.familyLinkedAt && (
                          <span className="truncate text-[0.6875rem] text-[#8A96AA]">
                            Linked {formatRequestDate(member.familyLinkedAt)}
                          </span>
                        )}
                      </div>
                      {member.familyRole && (
                        <span className="inline-flex shrink-0 rounded-full border border-[#EAF1FF] bg-white px-2.5 py-1 text-[0.6875rem] font-bold text-[#123B8D]">
                          {member.familyRole}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section
          ref={searchContainerRef}
          className="grid gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_18px_rgba(11,31,74,0.06)]"
        >
          <div className="grid gap-1">
            <AppText variant="h6">Family search</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              Search BaptistOne members and link them to your family profile.
            </AppText>
          </div>
          <AppInput
            label="Family search"
            placeholder="Search name, email, phone, or church"
            value={searchQuery}
            onFocus={() => {
              if (trimmedSearchQuery || searchResults.length) {
                setIsSearchPanelOpen(true);
              }
            }}
            onChange={handleSearchChange}
          />
          {showSearchPanel && searchStatusMessage && (
            <div
              className={`rounded-lg border p-3 text-sm font-semibold ${
                searchError
                  ? 'border-red-100 bg-red-50 text-red-700'
                  : 'border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7890]'
              }`}
            >
              {searchStatusMessage}
            </div>
          )}
          {showSearchPanel && searchResults.length > 0 && (
            <div className="grid max-h-[400px] gap-2 overflow-y-auto pr-1">
              {searchResults.map((member) => {
                const name = getMemberName(member);
                const linked = linkedMemberIds.includes(member.memberId);

                return (
                  <div
                    className="grid gap-3 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    key={member.memberId}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <AppAvatar name={name} src={member.avatarUrl ?? undefined} size="md" />
                      <div className="grid min-w-0 gap-1">
                        <span className="truncate text-sm font-black text-[#0B1F4A]">{name}</span>
                        {member.username && (
                          <span className="truncate text-xs font-semibold text-[#5A6880]">
                            @{member.username}
                          </span>
                        )}
                        {member.churchName && (
                          <span className="truncate text-xs font-semibold text-[#5A6880]">
                            {member.churchName}
                          </span>
                        )}
                      </div>
                    </div>
                    <AppButton
                      className="justify-self-start sm:justify-self-end"
                      leftIcon={<UserPlus className="size-4" aria-hidden />}
                      size="sm"
                      variant={linked ? 'outline' : 'primary'}
                      disabled={linked}
                      onClick={() => openRelationshipModal(member)}
                    >
                      {linked ? 'Linked' : 'Link member'}
                    </AppButton>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_18px_rgba(11,31,74,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div className="grid min-w-0 gap-1">
              <AppText variant="h6">Requests</AppText>
              <AppText variant="bodySmall" color="textSecondary">
                View pending family link requests sent to you.
              </AppText>
            </div>
            {activeRequests.length > 0 && (
              <AppButton size="sm" variant="outline" onClick={() => navigate(paths.familyRequests)}>
                View all
              </AppButton>
            )}
          </div>

          <AppScrollableTabs
            tabs={requestTabs.map((tab) => ({
              ...tab,
              badge: String(tab.value === 'sent' ? sentRequests.length : incomingRequests.length),
            }))}
            value={activeRequestTab}
            ariaLabel="Family request types"
            fullWidthTabs
            onValueChange={(value) => setActiveRequestTab(value as FamilyRequestTab)}
          />

          {activeRequestsLoading && !activeRequests.length && (
            <AppStateFeedback
              state="loading"
              label="Loading family requests"
              className="min-h-36"
            />
          )}
          {activeRequestsError && !activeRequests.length && (
            <AppStateFeedback
              state="error"
              title="Unable to load requests"
              description={activeRequestsError}
              retrying={activeRequestsLoading}
              className="min-h-40"
              onRetry={() =>
                activeRequestTab === 'sent' ? void fetchFamily() : void fetchFamilyRequests()
              }
            />
          )}
          {!activeRequestsLoading && !activeRequestsError && !activeRequests.length && (
            <AppStateFeedback
              state="empty"
              title={activeEmptyTitle}
              description={activeEmptyDescription}
              className="min-h-36"
            />
          )}
          {activeRequests.length > 0 && (
            <div className="grid gap-2">
              {previewRequests.map((request) => {
                const StatusIcon = request.status === 'ACCEPTED' ? CheckCircle2 : Clock3;

                return (
                  <div
                    className="grid gap-3 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3"
                    key={request.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <AppAvatar
                          name={request.name}
                          src={request.avatarUrl ?? undefined}
                          size="md"
                        />
                        <div className="grid min-w-0 gap-1">
                          <span className="truncate text-sm font-black text-[#0B1F4A]">
                            {request.name}
                          </span>
                          <span className="truncate text-xs font-semibold text-[#5A6880]">
                            {request.relationship}
                            {request.contact ? ` - ${request.contact}` : ''}
                          </span>
                          {request.message && (
                            <span className="line-clamp-2 text-xs font-semibold text-[#8A96AA]">
                              {request.message}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[0.6875rem] font-black capitalize ${statusClasses[request.status]}`}
                      >
                        <StatusIcon className="size-3.5" aria-hidden />
                        {request.status.toLowerCase()}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#8A96AA]">
                      <Mail className="size-3.5" aria-hidden />
                      <span>{request.direction === 'incoming' ? 'Incoming' : 'Outgoing'}</span>
                      <span>-</span>
                      <span>{request.sentAt}</span>
                    </div>
                    {request.direction === 'incoming' && request.status === 'PENDING' && (
                      <div className="grid grid-cols-2 gap-2">
                        <AppButton
                          fullWidth
                          leftIcon={<CheckCircle2 className="size-4" aria-hidden />}
                          loading={
                            requestActionLoading?.id === request.id &&
                            requestActionLoading.action === 'accept'
                          }
                          size="sm"
                          disabled={requestActionLoading !== null}
                          onClick={() => void handleIncomingRequestAction(request, 'accept')}
                        >
                          Accept
                        </AppButton>
                        <AppButton
                          fullWidth
                          leftIcon={<XCircle className="size-4" aria-hidden />}
                          loading={
                            requestActionLoading?.id === request.id &&
                            requestActionLoading.action === 'reject'
                          }
                          size="sm"
                          variant="secondary"
                          disabled={requestActionLoading !== null}
                          onClick={() => void handleIncomingRequestAction(request, 'reject')}
                        >
                          Reject
                        </AppButton>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <button
        aria-label="Invite family member"
        className="fixed right-4 top-[76dvh] z-40 grid size-14 place-items-center rounded-full border border-[#D4A017]/40 bg-[#D4A017] text-[#0B1F4A] shadow-[0_14px_32px_rgba(212,160,23,0.28)] transition duration-150 animate-[family-invite-breathe_2.4s_ease-in-out_infinite] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D4A017]/25 sm:right-6"
        type="button"
        onClick={openInviteModal}
      >
        <Plus className="size-7" strokeWidth={3} aria-hidden />
      </button>

      <AppModal
        open={isInviteModalOpen}
        title="Invite family member"
        panelClassName="animate-[family-modal-rise_180ms_ease-out_both]"
        footer={
          <>
            <AppButton variant="secondary" disabled={manualInviteLoading} onClick={closeInviteModal}>
              Cancel
            </AppButton>
            <AppButton
              form="family-manual-invite-form"
              loading={manualInviteLoading}
              disabled={!canSendManualRequest}
              type="submit"
            >
              Send invite
            </AppButton>
          </>
        }
        onClose={closeInviteModal}
      >
        <form className="grid gap-4" id="family-manual-invite-form" onSubmit={handleManualInvite}>
          <div className="flex items-start gap-3 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#FFF8E4] text-[#D4A017]">
              <Send className="size-5" aria-hidden />
            </span>
            <div className="grid gap-1">
              <AppText variant="bodyMedium" weight="bold">
                Manual family request
              </AppText>
              <AppText variant="bodySmall" color="textSecondary">
                Send an invite when your family member is not listed in search.
              </AppText>
            </div>
          </div>

          {manualInviteError && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {manualInviteError}
            </div>
          )}

          <AppDropdown
            label="Relationship"
            options={relationshipOptions.map((option) => ({
              label: option.value,
              value: option.value,
            }))}
            value={manualRelationship}
            onChange={(value) => setManualRelationship(value as FamilyRelationship)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <AppInput
              label="Name"
              placeholder="Jane Doe"
              value={manualName}
              onChange={(event) => setManualName(event.target.value)}
            />
            <AppInput
              label="Email"
              placeholder="jane@example.com"
              type="email"
              value={manualEmail}
              onChange={(event) => setManualEmail(event.target.value)}
            />
          </div>
          <AppInput
            label="Phone"
            placeholder="+2348012345678"
            type="tel"
            value={manualPhone}
            onChange={(event) => setManualPhone(event.target.value)}
          />
          <label className="grid gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">
              Message
            </span>
            <textarea
              className="min-h-24 rounded-[10px] border-[1.5px] border-[#D5DCE8] bg-white px-3.5 py-2.5 text-sm text-[#0B1F4A] outline-none transition-all duration-150 placeholder:text-[#A8B3C4] focus:border-[#123B8D] focus:ring-3 focus:ring-[#123B8D]/10"
              value={manualMessage}
              onChange={(event) => setManualMessage(event.target.value)}
            />
          </label>
        </form>
      </AppModal>

      <AppModal
        open={Boolean(selectedMember)}
        title="Select relationship"
        footer={
          <>
            <AppButton variant="secondary" onClick={closeRelationshipModal}>
              Cancel
            </AppButton>
            <AppButton loading={linking} onClick={handleLinkMember}>
              Link family member
            </AppButton>
          </>
        }
        onClose={closeRelationshipModal}
      >
        {selectedMember && (
          <div className="grid gap-4">
            <div className="flex min-w-0 items-start gap-3 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3">
              <AppAvatar
                name={selectedMemberName}
                src={selectedMember.avatarUrl ?? undefined}
                size="md"
              />
              <div className="grid min-w-0 gap-1">
                <AppText variant="bodyMedium" weight="bold" lineClamp={1}>
                  {selectedMemberName}
                </AppText>
                {selectedMember.username && (
                  <AppText variant="bodySmall" color="textSecondary" lineClamp={1}>
                    @{selectedMember.username}
                  </AppText>
                )}
              </div>
            </div>

            {linkError && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {linkError}
              </div>
            )}

            <div className="grid gap-2" role="radiogroup" aria-label="Relationship type">
              {relationshipOptions.map((option) => {
                const selected = selectedRelationship === option.value;

                return (
                  <button
                    className={`grid gap-1 rounded-lg border p-3 text-left transition ${
                      selected
                        ? 'border-[#123B8D] bg-[#EAF1FF] shadow-[0_8px_18px_rgba(18,59,141,0.12)]'
                        : 'border-[#E5E7EB] bg-white hover:border-[#B8C6E4]'
                    }`}
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSelectedRelationship(option.value)}
                  >
                    <span className="text-sm font-black text-[#0B1F4A]">{option.label}</span>
                    <span className="text-xs font-semibold text-[#5A6880]">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </AppModal>

      <AppModal
        open={isLeaveModalOpen}
        title="Leave family"
        footer={
          <>
            <AppButton variant="secondary" disabled={leaveLoading} onClick={closeLeaveModal}>
              Cancel
            </AppButton>
            <AppButton
              loading={leaveLoading}
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleLeaveFamily}
            >
              Leave family
            </AppButton>
          </>
        }
        onClose={closeLeaveModal}
      >
        <div className="grid gap-4">
          <div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
              <LogOut className="size-5" aria-hidden />
            </span>
            <div className="grid gap-1">
              <AppText variant="bodyMedium" weight="bold">
                Are you sure you want to leave?
              </AppText>
              <AppText variant="bodySmall" color="textSecondary">
                You will be removed from this family group. This action can be undone by sending a new
                family request.
              </AppText>
            </div>
          </div>

          {leaveError && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {leaveError}
            </div>
          )}

          <label className="grid gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">
              Reason (optional)
            </span>
            <textarea
              className="min-h-20 rounded-[10px] border-[1.5px] border-[#D5DCE8] bg-white px-3.5 py-2.5 text-sm text-[#0B1F4A] outline-none transition-all duration-150 placeholder:text-[#A8B3C4] focus:border-[#123B8D] focus:ring-3 focus:ring-[#123B8D]/10"
              placeholder="No longer part of this family group."
              value={leaveReason}
              onChange={(event) => setLeaveReason(event.target.value)}
            />
          </label>
        </div>
      </AppModal>
      </ChurchMembershipGuard>
    </AppShell>
  );
};

export default FamilyPage;
