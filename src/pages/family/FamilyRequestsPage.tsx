import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, Mail, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppScrollableTabs, AppText } from '@/components/common';
import { AppAvatar } from '@/components/display';
import { AppStateFeedback } from '@/components/feedback';
import { AppShell } from '@/layouts/AppShell';
import { familyInviteService } from '@/pages/profile/services/familyInviteService';
import type {
  FamilyLinkRequest,
  FamilyRelationship,
  UserFamilyInvitation,
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

const relationshipLabels: Record<FamilyRelationship, string> = {
  CHILD: 'Child',
  DEPENDANT: 'Dependant',
  OTHER: 'Other',
  SPOUSE: 'Spouse',
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  return fallback;
};

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
  relationship: relationshipLabels[request.relationship],
  contact: request.requesterUsername ?? undefined,
  message: request.message,
  status: request.status,
  direction: 'incoming',
  sentAt: formatRequestDate(request.createdAt),
});

const normalizeFamilyInvitation = (invitation: UserFamilyInvitation): FamilyRequestListItem => ({
  id: invitation.id,
  name: invitation.invitedName?.trim() || invitation.invitedEmail?.trim() || 'Invited member',
  relationship: relationshipLabels[invitation.relationship],
  contact: [invitation.invitedEmail, invitation.invitedPhone].filter(Boolean).join(' - '),
  message: invitation.message,
  status: normalizeRequestStatus(invitation.status),
  direction: 'outgoing',
  sentAt: formatRequestDate(invitation.sentAt || invitation.createdAt),
});

const FamilyRequestsPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [activeRequestTab, setActiveRequestTab] = useState<FamilyRequestTab>('sent');
  const [familyData, setFamilyData] = useState<NonNullable<UserFamilyResponse['data']> | null>(
    null,
  );
  const [linkRequests, setLinkRequests] = useState<FamilyRequestListItem[]>([]);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [familyError, setFamilyError] = useState<string | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestActionLoading, setRequestActionLoading] = useState<{
    id: string;
    action: FamilyRequestAction;
  } | null>(null);

  const sentRequests = useMemo(
    () => (familyData?.invitations ?? []).map(normalizeFamilyInvitation),
    [familyData?.invitations],
  );
  const incomingRequests = linkRequests;
  const requests = activeRequestTab === 'sent' ? sentRequests : incomingRequests;
  const activeLoading = activeRequestTab === 'sent' ? familyLoading : requestsLoading;
  const activeError = activeRequestTab === 'sent' ? familyError : requestsError;
  const activeEmptyTitle =
    activeRequestTab === 'sent' ? 'No sent requests' : 'No incoming requests';
  const activeEmptyDescription =
    activeRequestTab === 'sent'
      ? 'Family invitations you send will appear here.'
      : 'Family link requests sent to you will appear here.';

  const fetchFamily = useCallback(async () => {
    setFamilyLoading(true);
    setFamilyError(null);

    try {
      const familyResponse = await familyInviteService.getFamily();
      setFamilyData(familyResponse.data ?? null);
    } catch (fetchError) {
      setFamilyError(getErrorMessage(fetchError, 'Unable to load sent requests.'));
    } finally {
      setFamilyLoading(false);
    }
  }, []);

  const fetchLinkRequests = useCallback(async () => {
    setRequestsLoading(true);
    setRequestsError(null);

    try {
      const linkRequestsResponse = await familyInviteService.listLinkRequests();
      setLinkRequests((linkRequestsResponse.data?.items ?? []).map(normalizeLinkRequest));
    } catch (fetchError) {
      setRequestsError(getErrorMessage(fetchError, 'Unable to load incoming requests.'));
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchFamily();
      void fetchLinkRequests();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchFamily, fetchLinkRequests]);

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
                onClick={() => navigate(paths.family)}
              >
                Family requests
              </AppButton>
            </div>
          </div>
          <div className="mx-auto max-w-[78rem]">
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
          </div>
        </div>
      }
    >
      <main className="mx-auto grid max-w-[78rem] gap-3 px-4 py-4 pb-28 sm:px-6 md:px-9">
        {activeLoading && !requests.length && (
          <AppStateFeedback state="loading" label="Loading family requests" className="min-h-40" />
        )}
        {activeError && !requests.length && (
          <AppStateFeedback
            state="error"
            title="Unable to load requests"
            description={activeError}
            retrying={activeLoading}
            className="min-h-44"
            onRetry={() =>
              activeRequestTab === 'sent' ? void fetchFamily() : void fetchLinkRequests()
            }
          />
        )}
        {!activeLoading && !activeError && !requests.length && (
          <AppStateFeedback
            state="empty"
            title={activeEmptyTitle}
            description={activeEmptyDescription}
            className="min-h-40"
          />
        )}
        {requests.map((request) => {
          const StatusIcon = request.status === 'ACCEPTED' ? CheckCircle2 : Clock3;

          return (
            <div
              className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
              key={request.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <AppAvatar name={request.name} src={request.avatarUrl ?? undefined} size="md" />
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
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#8A96AA]">
                <Mail className="size-3.5" aria-hidden />
                <span>{request.direction === 'incoming' ? 'Incoming' : 'Outgoing'}</span>
                <span>-</span>
                <span>{request.sentAt}</span>
              </div>
              {request.direction === 'incoming' && request.status === 'PENDING' && (
                <div className="mt-3 grid grid-cols-2 gap-2">
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
      </main>
    </AppShell>
  );
};

export default FamilyRequestsPage;
