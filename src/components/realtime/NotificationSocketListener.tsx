import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import { pushNotification } from '@/store/slices/notificationSlice';
import type { RealtimeNotification } from '@/types/realtimeNotification';

export default function NotificationSocketListener() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const notifications = useAppSelector((state) => state.realtimeNotification.notifications);
  const activeFilter = useAppSelector((state) => state.realtimeNotification.activeFilter);

  const handleNotificationCreated = useCallback(
    (notification: RealtimeNotification) => {
      if (notification.type === 'transaction.completed') {
        const amount = notification.data.amountTotal != null ? (notification.data.amountTotal / 100).toLocaleString() : '';
        const currency = notification.data.currency ?? '';
        dispatch(
          pushNotification({
            type: 'success',
            title: notification.title || 'Payment Successful',
            message: amount ? `${currency} ${amount} has been credited to your wallet.` : notification.body,
          }),
        );
      }
    },
    [dispatch],
  );

  useNotificationSocket(
    accessToken ?? undefined,
    notifications,
    activeFilter,
    dispatch,
    handleNotificationCreated,
  );

  return null;
}
