import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Clock3, RefreshCw } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppLoader } from '@/components/feedback';
import { AppInput } from '@/components/form';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearChurchError,
  clearChurchOnboardingStatus,
  clearChurchRevokeStatus,
  setChurchQuery,
  setSelectedChurchId,
} from '@/store/slices/churchSlice';
import { pushNotification } from '@/store/slices/notificationSlice';
import {
  fetchChurchRegistrationOptionsThunk,
  onboardMemberToChurchThunk,
  revokeMembershipRequestThunk,
} from '@/store/thunks/churchThunk';
import { fetchMemberAccountThunk } from '@/store/thunks/memberThunk';
import { getChurchRequestErrorMessage } from '../utils/profileFormatters';
import {
  canRequestChurchMembership,
  getApprovedChurchDetails,
  getChurchAssociationName,
  getPendingMembershipRequestId,
} from '../utils/churchMembershipUtils';

export const ChurchMembershipPanel = () => {
  const dispatch = useAppDispatch();
  const initialFetchRequested = useRef(false);
  const searchEffectReady = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [revokeRequestIdError, setRevokeRequestIdError] = useState<string | null>(null);
  const memberAccount = useAppSelector((state) => state.member.data);
  const memberLoading = useAppSelector((state) => state.member.loading);
  const memberError = useAppSelector((state) => state.member.error);
  const {
    error,
    items,
    lastFetchedAt,
    loadMoreError,
    loading,
    loadingMore,
    meta,
    onboardingError,
    onboardingLoading,
    onboardingSuccessMessage,
    query,
    revokeError,
    revokeLoading,
    revokeSuccessMessage,
    selectedChurchId,
  } = useAppSelector((state) => state.church);
  const membershipStatus = memberAccount?.membershipStatus ?? null;
  const canJoinChurch = Boolean(memberAccount) && canRequestChurchMembership(membershipStatus);
  const pendingRequestId = getPendingMembershipRequestId(memberAccount);
  const approvedChurchDetails = useMemo(
    () => getApprovedChurchDetails(memberAccount),
    [memberAccount],
  );
  const selectedChurch = useMemo(
    () => items.find((church) => church.id === selectedChurchId) ?? null,
    [items, selectedChurchId],
  );
  const hasMoreChurches = Boolean(meta && meta.page < meta.totalPages);
  const nextChurchPage = (meta?.page ?? 1) + 1;

  useEffect(() => {
    if (!canJoinChurch) return;

    if (!searchEffectReady.current) {
      searchEffectReady.current = true;
      return;
    }

    if (!query.trim()) {
      return;
    }

    const debounceTimer = window.setTimeout(() => {
      dispatch(fetchChurchRegistrationOptionsThunk({ search: query, page: 1, limit: 20 }));
    }, 350);

    return () => window.clearTimeout(debounceTimer);
  }, [canJoinChurch, dispatch, query]);

  useEffect(() => {
    if (!canJoinChurch) return;

    const sentinel = loadMoreRef.current;

    if (!sentinel || !hasMoreChurches || loading || loadingMore || error || loadMoreError) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        dispatch(
          fetchChurchRegistrationOptionsThunk({ search: query, page: nextChurchPage, limit: 20 }),
        );
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [
    canJoinChurch,
    dispatch,
    error,
    hasMoreChurches,
    loadMoreError,
    loading,
    loadingMore,
    nextChurchPage,
    query,
  ]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(setChurchQuery(event.target.value));
    dispatch(setSelectedChurchId(null));
  };

  const handleRetryChurches = () => {
    dispatch(clearChurchError());
    dispatch(fetchChurchRegistrationOptionsThunk({ search: query, page: 1, limit: 20 }));
  };

  const handleRetryLoadMoreChurches = () => {
    dispatch(clearChurchError());
    dispatch(
      fetchChurchRegistrationOptionsThunk({ search: query, page: nextChurchPage, limit: 20 }),
    );
  };

  const handleRetryMemberAccount = () => {
    dispatch(fetchMemberAccountThunk());
  };

  const handleRevokeMembershipRequest = async () => {
    if (!pendingRequestId) {
      const errorMessage =
        'Unable to find the pending church request id. Please refresh and try again.';
      setRevokeRequestIdError(errorMessage);
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Unable to revoke request',
          message: errorMessage,
        }),
      );
      return;
    }

    setRevokeRequestIdError(null);
    dispatch(clearChurchRevokeStatus());

    try {
      const response = await dispatch(
        revokeMembershipRequestThunk({ requestId: pendingRequestId }),
      ).unwrap();
      dispatch(
        pushNotification({
          type: 'success',
          title: 'Church request revoked',
          message: response.message || 'Your pending church request has been withdrawn.',
        }),
      );
      dispatch(fetchMemberAccountThunk());
    } catch (requestError) {
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Unable to revoke request',
          message: getChurchRequestErrorMessage(requestError),
        }),
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedChurchId) return;

    dispatch(clearChurchOnboardingStatus());

    try {
      const response = await dispatch(
        onboardMemberToChurchThunk({ churchId: selectedChurchId }),
      ).unwrap();
      dispatch(
        pushNotification({
          type: 'success',
          title: 'Join request sent',
          message: response.message || 'Your request has been sent to the church admin.',
        }),
      );
      dispatch(fetchMemberAccountThunk());
    } catch (requestError) {
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Unable to send request',
          message: getChurchRequestErrorMessage(requestError),
        }),
      );
    }
  };

  if (memberLoading && !memberAccount) {
    return (
      <div className="grid min-h-[55vh] place-items-center pb-28">
        <AppLoader label="Loading membership" />
      </div>
    );
  }

  if (memberError && !memberAccount) {
    return (
      <div className="grid min-h-[55vh] place-items-center px-2 pb-28">
        <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
            <AlertCircle className="size-6" aria-hidden />
          </span>
          <div className="grid gap-1">
            <AppText variant="h6" color="#991B1B" align="center">
              Unable to load membership
            </AppText>
            <AppText variant="bodySmall" color="#B91C1C" align="center">
              {memberError}
            </AppText>
          </div>
          <AppButton
            leftIcon={<RefreshCw className="size-4" aria-hidden />}
            loading={memberLoading}
            onClick={handleRetryMemberAccount}
          >
            Retry
          </AppButton>
        </div>
      </div>
    );
  }

  if (!memberAccount) {
    return (
      <div className="grid min-h-[55vh] place-items-center pb-28">
        <AppLoader label="Loading membership" />
      </div>
    );
  }

  if (membershipStatus === 'PENDING') {
    return (
      <div className="grid min-h-[55vh] place-items-center px-2 pb-28">
        <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[#EAF1FF] text-[#123B8D]">
            <Clock3 className="size-6" aria-hidden />
          </span>
          <div className="grid gap-1">
            <AppText variant="h6" align="center">
              Church request pending
            </AppText>
            <AppText variant="bodySmall" color="textSecondary" align="center">
              Your church request is pending review. You can withdraw it and choose another church
              if needed.
            </AppText>
          </div>

          {revokeError && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {revokeError}
            </div>
          )}

          {revokeRequestIdError && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {revokeRequestIdError}
            </div>
          )}

          {revokeSuccessMessage && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
              {revokeSuccessMessage}
            </div>
          )}

          <AppButton
            fullWidth
            disabled={memberLoading}
            loading={revokeLoading}
            variant="outline"
            onClick={handleRevokeMembershipRequest}
          >
            Revoke church request
          </AppButton>
        </div>
      </div>
    );
  }

  if (membershipStatus === 'APPROVED') {
    return (
      <div className="grid min-h-[55vh] place-items-center px-2 pb-28">
        <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="size-6" aria-hidden />
          </span>
          <div className="grid gap-2">
            <AppText variant="h6" align="center">
              You are a member of {approvedChurchDetails.churchName}
            </AppText>
            {(approvedChurchDetails.associationName || approvedChurchDetails.conferenceName) && (
              <AppText variant="bodySmall" color="textSecondary" align="center">
                {[approvedChurchDetails.associationName, approvedChurchDetails.conferenceName]
                  .filter(Boolean)
                  .join(' - ')}
              </AppText>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading && !lastFetchedAt) {
    return (
      <div className="grid min-h-[55vh] place-items-center pb-28">
        <AppLoader label="Loading churches" />
      </div>
    );
  }

  if (error && !lastFetchedAt) {
    return (
      <div className="grid min-h-[55vh] place-items-center px-2 pb-28">
        <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
            <AlertCircle className="size-6" aria-hidden />
          </span>
          <div className="grid gap-1">
            <AppText variant="h6" color="#991B1B" align="center">
              Unable to load churches
            </AppText>
            <AppText variant="bodySmall" color="#B91C1C" align="center">
              {error}
            </AppText>
          </div>
          <AppButton
            leftIcon={<RefreshCw className="size-4" aria-hidden />}
            loading={loading}
            onClick={handleRetryChurches}
          >
            Retry
          </AppButton>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 pb-28">
      <form className="grid gap-4" id="church-membership-form" onSubmit={handleSubmit}>
        <AppInput
          label="Search church"
          placeholder="Search by church name"
          value={query}
          onChange={handleSearchChange}
        />

        {meta && (
          <AppText variant="caption" color="textMuted">
            Showing {items.length} of {meta.total} churches
          </AppText>
        )}

        {loading && (
          <div className="grid min-h-40 place-items-center">
            <AppLoader label="Loading churches" />
          </div>
        )}

        {error && (
          <div className="grid min-h-40 place-items-center px-2">
            <div className="grid w-full max-w-sm justify-items-center gap-3 text-center">
              <AppText variant="bodySmall" color="#B91C1C" align="center">
                {error}
              </AppText>
              <AppButton
                leftIcon={<RefreshCw className="size-4" aria-hidden />}
                loading={loading}
                size="sm"
                onClick={handleRetryChurches}
              >
                Retry
              </AppButton>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid gap-2" role="listbox" aria-label="Church registration options">
              {items.map((church) => {
                const selected = church.id === selectedChurchId;

                return (
                  <button
                    className={`grid min-h-16 gap-1 rounded-lg border p-3 text-left transition ${
                      selected
                        ? 'border-[#123B8D] bg-[#EAF1FF] shadow-[0_8px_20px_rgba(18,59,141,0.12)]'
                        : 'border-[#E5E7EB] bg-white hover:border-[#123B8D] hover:bg-[#F8FAFC]'
                    }`}
                    key={church.id}
                    role="option"
                    aria-selected={selected}
                    type="button"
                    onClick={() => dispatch(setSelectedChurchId(church.id))}
                  >
                    <span className="min-w-0 truncate text-sm font-bold text-[#0B1F4A]">
                      {church.name}
                    </span>
                    <span className="min-w-0 truncate text-xs font-semibold text-[#6B7890]">
                      {getChurchAssociationName(church)}
                    </span>
                  </button>
                );
              })}

              {items.length === 0 && (
                <div className="grid min-h-36 place-items-center text-center">
                  <AppText variant="bodySmall" color="textMuted">
                    {query.trim() ? 'No church found for your search.' : 'No churches available.'}
                  </AppText>
                </div>
              )}
            </div>

            {hasMoreChurches && !loadMoreError && (
              <div ref={loadMoreRef} className="grid min-h-16 place-items-center">
                {loadingMore ? (
                  <AppLoader label="Loading more churches" />
                ) : (
                  <span className="sr-only">Load more churches</span>
                )}
              </div>
            )}

            {loadMoreError && (
              <div className="grid justify-items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-center">
                <AppText variant="bodySmall" color="#B91C1C" align="center">
                  {loadMoreError}
                </AppText>
                <AppButton
                  leftIcon={<RefreshCw className="size-4" aria-hidden />}
                  loading={loadingMore}
                  size="sm"
                  variant="outline"
                  onClick={handleRetryLoadMoreChurches}
                >
                  Retry
                </AppButton>
              </div>
            )}
          </>
        )}

        {selectedChurch && (
          <div className="grid gap-1 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3">
            <AppText variant="bodyMedium" weight="bold">
              {selectedChurch.name}
            </AppText>
            <AppText variant="bodySmall" color="textSecondary">
              {getChurchAssociationName(selectedChurch)}
            </AppText>
          </div>
        )}

        {onboardingError && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {onboardingError}
          </div>
        )}

        {onboardingSuccessMessage && (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            {onboardingSuccessMessage}
          </div>
        )}
      </form>
      <div className="fixed right-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-0 z-40 border-t border-[#E5E7EB] bg-white/95 px-4 py-3 shadow-[0_-16px_36px_rgba(11,31,74,0.12)] backdrop-blur min-[1181px]:bottom-0 min-[1181px]:left-[18rem] min-[1181px]:px-9">
        <div className="mx-auto max-w-[78rem]">
          <AppButton
            fullWidth
            form="church-membership-form"
            loading={onboardingLoading}
            disabled={!selectedChurchId || !selectedChurch || loading || Boolean(error)}
            type="submit"
          >
            Send join request
          </AppButton>
        </div>
      </div>
    </div>
  );
};
