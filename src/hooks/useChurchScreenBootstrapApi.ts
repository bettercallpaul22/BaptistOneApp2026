import { useCallback, useEffect, useState } from 'react';
import { clearChurchDetails, clearChurchDetailsError } from '@/store/slices/churchSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchChurchDetailsThunk } from '@/store/thunks/churchThunk';
import { fetchMemberAccountThunk } from '@/store/thunks/memberThunk';
import type { MemberAccount } from '@/types/member';

const getBootstrapErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  return 'Unable to load church screen.';
};

const getApprovedChurchId = (memberAccount: MemberAccount | null) =>
  memberAccount?.membershipAndPreferences?.churchId || memberAccount?.basicProfile?.churchId || null;

export const useChurchScreenBootstrapApi = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const memberAccount = useAppSelector((state) => state.member.data);
  const memberLoading = useAppSelector((state) => state.member.loading);
  const details = useAppSelector((state) => state.church.details);
  const detailsLoading = useAppSelector((state) => state.church.detailsLoading);
  const detailsLastFetchedAt = useAppSelector((state) => state.church.detailsLastFetchedAt);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const bootstrap = useCallback(
    async (force = false) => {
      if (!isAuthenticated) {
        setBootstrapLoading(false);
        setBootstrapError(null);
        return;
      }

      const currentChurchId = getApprovedChurchId(memberAccount);

      if (!force && memberAccount?.membershipStatus === 'APPROVED' && currentChurchId && details?.id === currentChurchId && detailsLastFetchedAt) {
        setBootstrapLoading(false);
        setBootstrapError(null);
        return;
      }

      setBootstrapLoading(true);
      setBootstrapError(null);
      dispatch(clearChurchDetailsError());

      try {
        const account = force || !memberAccount ? (await dispatch(fetchMemberAccountThunk()).unwrap()).data : memberAccount;
        const membershipStatus = account.membershipStatus ?? 'NONE';

        if (membershipStatus !== 'APPROVED') {
          dispatch(clearChurchDetails());
          return;
        }

        const churchId = getApprovedChurchId(account);

        if (!churchId) {
          throw new Error('Your membership is approved, but no church was found for your account.');
        }

        if (!force && details?.id === churchId && detailsLastFetchedAt) {
          return;
        }

        await dispatch(fetchChurchDetailsThunk(churchId)).unwrap();
      } catch (requestError) {
        setBootstrapError(getBootstrapErrorMessage(requestError));
      } finally {
        setBootstrapLoading(false);
      }
    },
    [details, detailsLastFetchedAt, dispatch, isAuthenticated, memberAccount],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void bootstrap(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [bootstrap]);

  return {
    church: details,
    error: bootstrapError,
    loading: bootstrapLoading || memberLoading || detailsLoading,
    membershipStatus: memberAccount?.membershipStatus ?? null,
    retry: () => void bootstrap(true),
  };
};
