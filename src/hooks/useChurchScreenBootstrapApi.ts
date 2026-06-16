import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  ChurchPastorItem,
  ChurchPastorMeta,
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

const formatPastorTitle = (pastorType: string | null | undefined) => {
  const normalizedType = pastorType?.trim();

  if (!normalizedType) return 'Pastor';

  return normalizedType
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
};

const getPastorName = (pastor: ChurchPastorItem) => {
  const profile = pastor.basicProfile;
  const displayName = profile?.displayName?.trim();
  const fullName = [profile?.firstName, profile?.otherName, profile?.lastName]
    .map((name) => name?.trim())
    .filter(Boolean)
    .join(' ');

  return displayName || fullName || 'Church pastor';
};

const getPastorAvatarUrl = (pastor: ChurchPastorItem) =>
  pastor.basicProfile?.avatar?.url || pastor.basicProfile?.avatarUrl || null;

const normalizePastorToLeader = (pastor: ChurchPastorItem, churchId: string): ChurchLeadershipItem => ({
  id: pastor.id,
  createdAt: pastor.createdAt,
  churchId,
  type: 'PASTOR',
  name: getPastorName(pastor),
  title: formatPastorTitle(pastor.preferences?.pastorType),
  email: pastor.basicProfile?.email ?? null,
  avatarUrl: getPastorAvatarUrl(pastor),
  isActive: pastor.deletedAt ? false : true,
});

const getLeaderIdentityKeys = (leader: ChurchLeadershipItem) =>
  [leader.id, leader.email?.trim().toLowerCase()].filter((key): key is string => Boolean(key));

const mergeLeadershipWithPastors = (
  leadership: ChurchLeadershipItem[],
  pastors: ChurchPastorItem[],
  churchId: string | null,
) => {
  if (!churchId) return leadership;

  const seenKeys = new Set<string>();
  const mergedLeadership: ChurchLeadershipItem[] = [];

  const addLeader = (leader: ChurchLeadershipItem) => {
    const identityKeys = getLeaderIdentityKeys(leader);

    if (identityKeys.some((key) => seenKeys.has(key))) return;

    mergedLeadership.push(leader);
    identityKeys.forEach((key) => seenKeys.add(key));
  };

  leadership.forEach(addLeader);
  pastors
    .filter((pastor) => pastor.preferences?.churchId === churchId)
    .map((pastor) => normalizePastorToLeader(pastor, churchId))
    .forEach(addLeader);

  return mergedLeadership;
};

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
  const [pastors, setPastors] = useState<ChurchPastorItem[]>([]);
  const [pastorsMeta, setPastorsMeta] = useState<ChurchPastorMeta | null>(null);
  const [pastorsChurchId, setPastorsChurchId] = useState<string | null>(null);
  const [pastorsLastFetchedAt, setPastorsLastFetchedAt] = useState<string | null>(null);
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
    setPastors([]);
    setPastorsMeta(null);
    setPastorsChurchId(null);
    setPastorsLastFetchedAt(null);
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
        pastorsChurchId === currentChurchId &&
        pastorsLastFetchedAt &&
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
          pastorsChurchId === churchId &&
          pastorsLastFetchedAt &&
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
          pastorsChurchId !== churchId ||
          !pastorsLastFetchedAt ||
          documentsChurchId !== churchId ||
          !documentsLastFetchedAt ||
          eventsChurchId !== churchId ||
          !eventsLastFetchedAt
        ) {
          resetLocalChurchResources();
        }

        const [, leadershipResponse, pastorsResponse, documentsResponse, eventsResponse] = await Promise.all([
          dispatch(fetchChurchDetailsThunk(churchId)).unwrap(),
          churchService.getLeadership(churchId, { page: 1, limit: 20 }),
          churchService.getPastors(churchId, { page: 1, limit: 25 }),
          churchService.getDocuments(churchId, { page: 1, limit: 25 }),
          churchService.getEvents(churchId, { page: 1, limit: 25 }),
        ]);
        const lastFetchedAt = new Date().toISOString();
        const currentChurchPastors = pastorsResponse.items.filter((pastor) => pastor.preferences?.churchId === churchId);

        setLeadership(leadershipResponse.items);
        setLeadershipMeta(leadershipResponse.meta);
        setLeadershipChurchId(churchId);
        setLeadershipLastFetchedAt(lastFetchedAt);
        setPastors(currentChurchPastors);
        setPastorsMeta(pastorsResponse.meta);
        setPastorsChurchId(churchId);
        setPastorsLastFetchedAt(lastFetchedAt);
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
      pastorsChurchId,
      pastorsLastFetchedAt,
      resetLocalChurchResources,
    ],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void bootstrap(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [bootstrap]);

  const mergedLeadership = useMemo(
    () => mergeLeadershipWithPastors(leadership, pastors, pastorsChurchId ?? leadershipChurchId ?? getApprovedChurchId(memberAccount)),
    [leadership, leadershipChurchId, memberAccount, pastors, pastorsChurchId],
  );

  return {
    church: details,
    documents,
    documentsMeta,
    documentsLoading: bootstrapLoading && !documentsMeta,
    error: bootstrapError,
    events,
    eventsMeta,
    eventsLoading: bootstrapLoading && !eventsMeta,
    leadership: mergedLeadership,
    leadershipMeta,
    leadershipLoading: bootstrapLoading && (!leadershipMeta || !pastorsMeta),
    loading: bootstrapLoading || memberLoading || detailsLoading,
    membershipStatus: memberAccount?.membershipStatus ?? null,
    pastors,
    pastorsMeta,
    pastorsLoading: bootstrapLoading && !pastorsMeta,
    retry: () => void bootstrap(true),
  };
};
