import { useCallback, useEffect, useRef, useState } from 'react';
import { churchService } from '@/services/church/churchService';
import { clearChurchDetails, clearChurchDetailsError } from '@/store/slices/churchSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchChurchDetailsThunk } from '@/store/thunks/churchThunk';
import { fetchMemberAccountThunk } from '@/store/thunks/memberThunk';
import type {
  ChurchDocumentItem,
  ChurchDocumentMeta,
  ChurchEventItem,
  ChurchEventMeta,
  ChurchLeadershipItem,
  ChurchLeadershipMeta,
} from '@/types/church';
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
  const [leadership, setLeadership] = useState<ChurchLeadershipItem[]>([]);
  const [leadershipMeta, setLeadershipMeta] = useState<ChurchLeadershipMeta | null>(null);
  const [leadershipChurchId, setLeadershipChurchId] = useState<string | null>(null);
  const [leadershipLastFetchedAt, setLeadershipLastFetchedAt] = useState<string | null>(null);
  const [documents, setDocuments] = useState<ChurchDocumentItem[]>([]);
  const [documentsMeta, setDocumentsMeta] = useState<ChurchDocumentMeta | null>(null);
  const [documentsChurchId, setDocumentsChurchId] = useState<string | null>(null);
  const [documentsLastFetchedAt, setDocumentsLastFetchedAt] = useState<string | null>(null);
  const [events, setEvents] = useState<ChurchEventItem[]>([]);
  const [eventsMeta, setEventsMeta] = useState<ChurchEventMeta | null>(null);
  const [eventsChurchId, setEventsChurchId] = useState<string | null>(null);
  const [eventsLastFetchedAt, setEventsLastFetchedAt] = useState<string | null>(null);
  const pendingBootstrapChurchId = useRef<string | null>(null);

  const resetLocalChurchResources = useCallback(() => {
    setLeadership([]);
    setLeadershipMeta(null);
    setLeadershipChurchId(null);
    setLeadershipLastFetchedAt(null);
    setDocuments([]);
    setDocumentsMeta(null);
    setDocumentsChurchId(null);
    setDocumentsLastFetchedAt(null);
    setEvents([]);
    setEventsMeta(null);
    setEventsChurchId(null);
    setEventsLastFetchedAt(null);
  }, []);

  const bootstrap = useCallback(
    async (force = false) => {
      if (!isAuthenticated) {
        pendingBootstrapChurchId.current = null;
        setBootstrapLoading(false);
        setBootstrapError(null);
        resetLocalChurchResources();
        return;
      }

      const currentChurchId = getApprovedChurchId(memberAccount);

      if (!force && currentChurchId && pendingBootstrapChurchId.current === currentChurchId) {
        return;
      }

      if (
        !force &&
        memberAccount?.membershipStatus === 'APPROVED' &&
        currentChurchId &&
        details?.id === currentChurchId &&
        detailsLastFetchedAt &&
        leadershipChurchId === currentChurchId &&
        leadershipLastFetchedAt &&
        documentsChurchId === currentChurchId &&
        documentsLastFetchedAt &&
        eventsChurchId === currentChurchId &&
        eventsLastFetchedAt
      ) {
        setBootstrapLoading(false);
        setBootstrapError(null);
        return;
      }

      setBootstrapLoading(true);
      setBootstrapError(null);
      dispatch(clearChurchDetailsError());

      let ownsPendingBootstrap = false;
      let preservePendingLoading = false;

      try {
        const account = force || !memberAccount ? (await dispatch(fetchMemberAccountThunk()).unwrap()).data : memberAccount;
        const membershipStatus = account.membershipStatus ?? 'NONE';

        if (membershipStatus !== 'APPROVED') {
          pendingBootstrapChurchId.current = null;
          dispatch(clearChurchDetails());
          resetLocalChurchResources();
          return;
        }

        const churchId = getApprovedChurchId(account);

        if (!churchId) {
          throw new Error('Your membership is approved, but no church was found for your account.');
        }

        if (
          !force &&
          details?.id === churchId &&
          detailsLastFetchedAt &&
          leadershipChurchId === churchId &&
          leadershipLastFetchedAt &&
          documentsChurchId === churchId &&
          documentsLastFetchedAt &&
          eventsChurchId === churchId &&
          eventsLastFetchedAt
        ) {
          return;
        }

        if (!force && pendingBootstrapChurchId.current === churchId) {
          preservePendingLoading = true;
          return;
        }

        pendingBootstrapChurchId.current = churchId;
        ownsPendingBootstrap = true;
        if (
          force ||
          leadershipChurchId !== churchId ||
          !leadershipLastFetchedAt ||
          documentsChurchId !== churchId ||
          !documentsLastFetchedAt ||
          eventsChurchId !== churchId ||
          !eventsLastFetchedAt
        ) {
          resetLocalChurchResources();
        }

        const [, leadershipResponse, documentsResponse, eventsResponse] = await Promise.all([
          dispatch(fetchChurchDetailsThunk(churchId)).unwrap(),
          churchService.getLeadership(churchId, { page: 1, limit: 20 }),
          churchService.getDocuments(churchId, { page: 1, limit: 25 }),
          churchService.getEvents(churchId, { page: 1, limit: 25 }),
        ]);
        const lastFetchedAt = new Date().toISOString();

        setLeadership(leadershipResponse.items);
        setLeadershipMeta(leadershipResponse.meta);
        setLeadershipChurchId(churchId);
        setLeadershipLastFetchedAt(lastFetchedAt);
        setDocuments(documentsResponse.items);
        setDocumentsMeta(documentsResponse.meta);
        setDocumentsChurchId(churchId);
        setDocumentsLastFetchedAt(lastFetchedAt);
        setEvents(eventsResponse.items);
        setEventsMeta(eventsResponse.meta);
        setEventsChurchId(churchId);
        setEventsLastFetchedAt(lastFetchedAt);
      } catch (requestError) {
        setBootstrapError(getBootstrapErrorMessage(requestError));
      } finally {
        if (ownsPendingBootstrap) {
          pendingBootstrapChurchId.current = null;
        }
        if (!preservePendingLoading) {
          setBootstrapLoading(false);
        }
      }
    },
    [
      details,
      detailsLastFetchedAt,
      dispatch,
      documentsChurchId,
      documentsLastFetchedAt,
      eventsChurchId,
      eventsLastFetchedAt,
      isAuthenticated,
      leadershipChurchId,
      leadershipLastFetchedAt,
      memberAccount,
      resetLocalChurchResources,
    ],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void bootstrap(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [bootstrap]);

  return {
    church: details,
    documents,
    documentsMeta,
    documentsLoading: bootstrapLoading && !documentsMeta,
    error: bootstrapError,
    events,
    eventsMeta,
    eventsLoading: bootstrapLoading && !eventsMeta,
    leadership,
    leadershipMeta,
    leadershipLoading: bootstrapLoading && !leadershipMeta,
    loading: bootstrapLoading || memberLoading || detailsLoading,
    membershipStatus: memberAccount?.membershipStatus ?? null,
    retry: () => void bootstrap(true),
  };
};
