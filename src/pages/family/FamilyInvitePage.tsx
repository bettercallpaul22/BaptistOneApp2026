import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, LogIn, UserPlus, Users, XCircle } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppAvatar } from '@/components/display';
import { AppStateFeedback } from '@/components/feedback';
import { storageKeys } from '@/constants/storage';
import { familyInviteService } from '@/pages/profile/services/familyInviteService';
import type { FamilyLinkRequest, FamilyRelationship } from '@/pages/profile/types/familyInviteTypes';
import { paths } from '@/routes/paths';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { pushNotification } from '@/store/slices/notificationSlice';

type InviteAction = 'accept' | 'reject';
type ActionStatus = 'idle' | 'success';

const relationshipLabels: Record<FamilyRelationship, string> = {
  CHILD: 'child',
  DEPENDANT: 'dependant',
  OTHER: 'family member',
  SPOUSE: 'spouse',
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  return fallback;
};

const getRequesterName = (request: FamilyLinkRequest | null) =>
  request?.requesterName?.trim() || request?.requesterUsername?.trim() || 'A BaptistOne member';

const FamilyInvitePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthChecked, isAuthenticated } = useAppSelector((state) => state.auth);
  const inviteId = searchParams.get('inviteId')?.trim() ?? '';
  const [request, setRequest] = useState<FamilyLinkRequest | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<InviteAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<ActionStatus>('idle');
  const requesterName = getRequesterName(request);
  const relationshipText = request ? relationshipLabels[request.relationship] : 'family member';
  const redirectPath = `${location.pathname}${location.search}${location.hash}`;
  const canAct = Boolean(inviteId) && isAuthenticated && actionStatus === 'idle';

  const title = useMemo(() => {
    if (actionStatus === 'success') return 'Family invite updated';
    return 'Family invitation';
  }, [actionStatus]);

  const fetchInviteDetails = useCallback(async () => {
    if (!inviteId || !isAuthenticated) return;

    setDetailsLoading(true);
    setDetailsError(null);

    try {
      const response = await familyInviteService.listLinkRequests();
      const matchingRequest =
        response.data?.items.find((item) => item.id === inviteId || item.familyId === inviteId) ?? null;
      setRequest(matchingRequest);
    } catch (error) {
      setDetailsError(getErrorMessage(error, 'Unable to load invite details.'));
    } finally {
      setDetailsLoading(false);
    }
  }, [inviteId, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const timeoutId = window.setTimeout(() => {
      void fetchInviteDetails();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchInviteDetails, isAuthenticated]);

  const preserveRedirect = () => {
    sessionStorage.setItem(storageKeys.postAuthRedirect, redirectPath);
  };

  const goToAuth = (path: string) => {
    preserveRedirect();
    navigate(path, {
      state: {
        from: {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
        },
      },
    });
  };

  const handleInviteAction = async (action: InviteAction) => {
    if (!inviteId) return;

    if (!isAuthenticated) {
      preserveRedirect();
      return;
    }

    setActionLoading(action);
    setActionError(null);

    try {
      const response =
        action === 'accept'
          ? await familyInviteService.acceptInvitation(inviteId)
          : await familyInviteService.rejectInvitation(inviteId);

      setActionStatus('success');
      dispatch(
        pushNotification({
          type: 'success',
          title: action === 'accept' ? 'Invite accepted' : 'Invite rejected',
          message:
            response.message ||
            (action === 'accept'
              ? 'You have joined this family profile.'
              : 'The family invite has been rejected.'),
        }),
      );
    } catch (error) {
      const message = getErrorMessage(
        error,
        action === 'accept' ? 'Unable to accept invite.' : 'Unable to reject invite.',
      );
      setActionError(message);
      dispatch(
        pushNotification({
          type: 'error',
          title: action === 'accept' ? 'Unable to accept invite' : 'Unable to reject invite',
          message,
        }),
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthChecked) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8FAFC] px-4 py-8">
        <AppStateFeedback state="loading" label="Checking session" />
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#F8FAFC] px-4 py-8 text-[#0B1F4A]">
      <section className="grid w-full max-w-[30rem] gap-5 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_44px_rgba(11,31,74,0.12)]">
        <div className="grid justify-items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-[#EAF1FF] text-[#123B8D]">
            {actionStatus === 'success' ? (
              <CheckCircle2 className="size-7" aria-hidden />
            ) : (
              <Users className="size-7" aria-hidden />
            )}
          </span>
          <div className="grid gap-1">
            <AppText variant="h4" align="center">
              {title}
            </AppText>
            <AppText variant="bodySmall" color="textSecondary" align="center">
              {actionStatus === 'success'
                ? 'Your response has been recorded.'
                : 'Review this BaptistOne family invitation.'}
            </AppText>
          </div>
        </div>

        {!inviteId && (
          <AppStateFeedback
            state="error"
            title="Invite link is missing"
            description="This family invite link does not include an invite ID."
            className="min-h-48"
          />
        )}

        {inviteId && actionStatus === 'idle' && (
          <>
            <div className="grid gap-3 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4">
              <div className="flex min-w-0 items-start gap-3">
                <AppAvatar name={requesterName} src={request?.requesterAvatarUrl ?? undefined} size="md" />
                <div className="grid min-w-0 gap-1">
                  <AppText variant="bodyMedium" weight="bold" lineClamp={1}>
                    {requesterName}
                  </AppText>
                  <AppText variant="bodySmall" color="textSecondary">
                    wants to link you as their {relationshipText}.
                  </AppText>
                  {request?.message && (
                    <AppText variant="caption" color="textMuted" lineClamp={3}>
                      {request.message}
                    </AppText>
                  )}
                </div>
              </div>
              {detailsLoading && (
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#5A6880]">
                  <Clock3 className="size-3.5" aria-hidden />
                  Loading invite details
                </span>
              )}
              {detailsError && (
                <span className="text-xs font-semibold text-amber-700">
                  Invite details could not be loaded, but you can still respond.
                </span>
              )}
            </div>

            {actionError && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {actionError}
              </div>
            )}

            {!isAuthenticated ? (
              <div className="grid gap-3 rounded-lg border border-[#EAF1FF] bg-[#F8FAFC] p-4">
                <AppText variant="bodyMedium" weight="bold">
                  Login required
                </AppText>
                <AppText variant="bodySmall" color="textSecondary">
                  Please login or create an account to respond to this family invitation.
                </AppText>
                <div className="grid gap-2 sm:grid-cols-2">
                  <AppButton
                    leftIcon={<LogIn className="size-4" aria-hidden />}
                    onClick={() => goToAuth(paths.login)}
                  >
                    Login
                  </AppButton>
                  <AppButton
                    leftIcon={<UserPlus className="size-4" aria-hidden />}
                    variant="secondary"
                    onClick={() => goToAuth(paths.register)}
                  >
                    Create account
                  </AppButton>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <AppButton
                  disabled={Boolean(actionLoading) || !canAct}
                  loading={actionLoading === 'accept'}
                  leftIcon={<CheckCircle2 className="size-4" aria-hidden />}
                  onClick={() => void handleInviteAction('accept')}
                >
                  Accept
                </AppButton>
                <AppButton
                  disabled={Boolean(actionLoading) || !canAct}
                  loading={actionLoading === 'reject'}
                  leftIcon={<XCircle className="size-4" aria-hidden />}
                  variant="secondary"
                  onClick={() => void handleInviteAction('reject')}
                >
                  Reject
                </AppButton>
              </div>
            )}
          </>
        )}

        {inviteId && actionStatus === 'success' && (
          <div className="grid gap-3">
            <AppButton onClick={() => navigate(isAuthenticated ? paths.family : paths.home)}>
              {isAuthenticated ? 'Go to Family' : 'Go home'}
            </AppButton>
          </div>
        )}
      </section>
    </main>
  );
};

export default FamilyInvitePage;
