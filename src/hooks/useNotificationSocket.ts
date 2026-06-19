import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { env } from '@/config/env';
import type { AppDispatch } from '@/store';
import { pushNotification } from '@/store/slices/notificationSlice';
import { setUnreadCount, upsertNotification, updateReadState } from '@/store/slices/realtimeNotificationSlice';
import type { RealtimeNotification, FilterCategory } from '@/types/realtimeNotification';

const MEMBER_REFRESH_TYPES = new Set([
  'member.removed.from-church',
  'member.membership.request.revoked',
  'member.membership.approved',
]);

const TRANSACTION_REFRESH_TYPES = new Set(['transaction.completed']);

const MINISTRY_REFRESH_TYPES = new Set(['member.ministry.request.approved']);

const DEPARTMENT_REFRESH_TYPES = new Set(['member.department.request.approved']);

export function useNotificationSocket(
  accessToken: string | undefined,
  notifications: RealtimeNotification[],
  activeFilter: FilterCategory,
  dispatch: AppDispatch,
  onNotificationCreated?: (notification: RealtimeNotification) => void,
) {
  const socketRef = useRef<Socket | null>(null);
  const accessTokenRef = useRef(accessToken);
  const notificationsRef = useRef(notifications);
  const activeFilterRef = useRef(activeFilter);
  const dispatchRef = useRef(dispatch);
  const forceReconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectStateRef = useRef({
    windowStartAt: 0,
    attemptsInWindow: 0,
    blockedUntil: 0,
  });

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    activeFilterRef.current = activeFilter;
  }, [activeFilter]);

  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(env.socketNotificationsUrl, {
      transports: ['websocket', 'polling'],
      auth: { token: accessToken },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
    socketRef.current = socket;

    const handleConnected = () => {
      console.log('[socket] connected', { id: socket.id, url: env.socketNotificationsUrl });
    };

    const handleConnectError = (err: { message: string }) => {
      console.log('[socket] connect_error', err.message);
    };

    const handleNotificationCreated = (notification: RealtimeNotification) => {
      console.log('[socket] notification.created', { type: notification.type, id: notification.id });
      console.log('transaction.completed', { type: notification.type, id: notification.id }, notification);

      onNotificationCreated?.(notification);

      if (MEMBER_REFRESH_TYPES.has(notification.type)) {
        console.log('[socket] refreshing member data due to', notification.type);
        import('@/store/thunks/memberThunk').then(({ fetchMemberAccountThunk }) => {
          dispatchRef.current(fetchMemberAccountThunk());
        });
      }
      if (TRANSACTION_REFRESH_TYPES.has(notification.type)) {
        console.log('[socket] refreshing wallet data due to', notification.type);
        import('@/store/thunks/walletThunk').then(({ fetchWalletsThunk }) => {
          dispatchRef.current(fetchWalletsThunk());
        });
      }
      if (MINISTRY_REFRESH_TYPES.has(notification.type)) {
        console.log('[socket] refreshing ministry data due to', notification.type);
        dispatchRef.current(
          pushNotification({
            type: 'success',
            title: 'Ministry request approved',
            message: 'Your ministry membership has been updated.',
          }),
        );
        import('@/store/thunks/ministryThunk').then(({
          fetchChurchMinistriesThunk,
          fetchMyMinistriesThunk,
        }) => {
          dispatchRef.current(fetchMyMinistriesThunk());
          dispatchRef.current(fetchChurchMinistriesThunk());
        });
      }
      if (DEPARTMENT_REFRESH_TYPES.has(notification.type)) {
        console.log('[socket] refreshing department data due to', notification.type);
        dispatchRef.current(
          pushNotification({
            type: 'success',
            title: 'Department request approved',
            message: 'Your department membership has been updated.',
          }),
        );
        import('@/store/slices/forumSlice').then(({
          fetchChurchDepartmentsThunk,
          fetchDepartmentRequestsThunk,
          fetchUserDepartmentsThunk,
        }) => {
          dispatchRef.current(fetchUserDepartmentsThunk());
          dispatchRef.current(fetchChurchDepartmentsThunk());
          dispatchRef.current(fetchDepartmentRequestsThunk());
        });
      }

      dispatchRef.current(upsertNotification(notification));
    };

    const handleUnreadCountUpdated = ({ count }: { count: number }) => {
      console.log('[socket] notification.unread-count.updated', { count });
      dispatchRef.current(setUnreadCount(count));
    };

    const handleReadStateUpdated = ({
      notificationId,
      readAt,
    }: {
      notificationId: string;
      readAt: string | null;
    }) => {
      console.log('[socket] notification.read-state.updated', { notificationId, readAt });
      dispatchRef.current(updateReadState({ notificationId, readAt }));
    };

    const handleDisconnect = (reason: string) => {
      console.log('[socket] disconnected', { reason });

      if (reason === 'io server disconnect' && accessTokenRef.current) {
        const now = Date.now();
        const state = reconnectStateRef.current;

        if (state.blockedUntil > now) return;

        const ONE_MINUTE = 60_000;
        if (state.windowStartAt === 0 || now - state.windowStartAt > ONE_MINUTE) {
          state.windowStartAt = now;
          state.attemptsInWindow = 0;
        }

        state.attemptsInWindow += 1;
        if (state.attemptsInWindow > 4) {
          state.blockedUntil = now + 2 * ONE_MINUTE;
          return;
        }

        if (forceReconnectTimeoutRef.current) {
          clearTimeout(forceReconnectTimeoutRef.current);
        }

        forceReconnectTimeoutRef.current = setTimeout(() => {
          if (!socket.connected && accessTokenRef.current) {
            socket.auth = { token: accessTokenRef.current };
            socket.connect();
          }
        }, 700);
      }
    };

    socket.on('connect', handleConnected);
    socket.on('connect_error', handleConnectError);
    socket.on('notification.created', handleNotificationCreated);
    socket.on('notification.unread-count.updated', handleUnreadCountUpdated);
    socket.on('notification.read-state.updated', handleReadStateUpdated);
    socket.on('disconnect', handleDisconnect);

    return () => {
      if (forceReconnectTimeoutRef.current) {
        clearTimeout(forceReconnectTimeoutRef.current);
        forceReconnectTimeoutRef.current = null;
      }
      socket.off('connect', handleConnected);
      socket.off('connect_error', handleConnectError);
      socket.off('notification.created', handleNotificationCreated);
      socket.off('notification.unread-count.updated', handleUnreadCountUpdated);
      socket.off('notification.read-state.updated', handleReadStateUpdated);
      socket.off('disconnect', handleDisconnect);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, onNotificationCreated]);

  return socketRef;
}
