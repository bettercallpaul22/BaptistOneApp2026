import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
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
import { formatDate } from '@/utils/formatDate';

type FamilyRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'SENT';

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
  const navigate = useNavigate();
  const [familyData, setFamilyData] = useState<NonNullable<UserFamilyResponse['data']> | null>(
    null,
  );
  const [linkRequests, setLinkRequests] = useState<FamilyRequestListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requests = useMemo(
    () => [
      ...(familyData?.invitations ?? []).map(normalizeFamilyInvitation),
      ...linkRequests,
    ],
    [familyData?.invitations, linkRequests],
  );

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [familyResponse, linkRequestsResponse] = await Promise.all([
        familyInviteService.getFamily(),
        familyInviteService.listLinkRequests(),
      ]);

      setFamilyData(familyResponse.data ?? null);
      setLinkRequests((linkRequestsResponse.data?.items ?? []).map(normalizeLinkRequest));
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Unable to load family requests.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchRequests();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchRequests]);

  return (
    <AppShell>
      <main className="mx-auto grid max-w-[78rem] gap-5 px-4 py-6 pb-28 sm:px-6 md:px-9">
        <div className="flex items-center gap-3">
          <AppButton
            aria-label="Back to family"
            size="sm"
            variant="outline"
            onClick={() => navigate(paths.family)}
          >
            <ArrowLeft className="size-4" aria-hidden />
          </AppButton>
          <div className="grid min-w-0 gap-1">
            <AppText variant="h5">Family requests</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              View family invitations and link requests.
            </AppText>
          </div>
        </div>

        <section className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_18px_rgba(11,31,74,0.06)]">
          {loading && !requests.length && (
            <AppStateFeedback state="loading" label="Loading family requests" className="min-h-40" />
          )}
          {error && !requests.length && (
            <AppStateFeedback
              state="error"
              title="Unable to load requests"
              description={error}
              retrying={loading}
              className="min-h-44"
              onRetry={() => void fetchRequests()}
            />
          )}
          {!loading && !error && !requests.length && (
            <AppStateFeedback
              state="empty"
              title="No pending requests"
              description="Family requests will appear here."
              className="min-h-40"
            />
          )}
          {requests.map((request) => {
            const StatusIcon = request.status === 'ACCEPTED' ? CheckCircle2 : Clock3;

            return (
              <div
                className="grid gap-3 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3"
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
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#8A96AA]">
                  <Mail className="size-3.5" aria-hidden />
                  <span>{request.direction === 'incoming' ? 'Incoming' : 'Outgoing'}</span>
                  <span>-</span>
                  <span>{request.sentAt}</span>
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </AppShell>
  );
};

export default FamilyRequestsPage;
