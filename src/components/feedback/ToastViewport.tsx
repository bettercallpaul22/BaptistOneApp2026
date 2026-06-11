import { useEffect } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { removeNotification } from '@/store/slices/notificationSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const toastClasses = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-900',
};

export const ToastViewport = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.notifications);

  useEffect(() => {
    const timers = notifications.map((notification) =>
      window.setTimeout(() => {
        dispatch(removeNotification(notification.id));
      }, 5000),
    );

    return () => timers.forEach(window.clearTimeout);
  }, [dispatch, notifications]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[80] grid w-[min(24rem,calc(100vw-2rem))] gap-3" role="status" aria-live="polite">
      {notifications.map((notification) => (
        <section
          className={clsx('relative grid gap-1 rounded-lg border p-4 pr-11 shadow-[0_18px_40px_rgba(11,31,74,0.16)]', toastClasses[notification.type])}
          key={notification.id}
        >
          <strong className="text-sm">{notification.title}</strong>
          {notification.message && <p className="m-0 text-sm opacity-85">{notification.message}</p>}
          <button
            aria-label="Dismiss notification"
            className="absolute top-3 right-3 grid size-7 place-items-center rounded-md border-0 bg-transparent text-current opacity-70 hover:opacity-100"
            type="button"
            onClick={() => dispatch(removeNotification(notification.id))}
          >
            <X className="size-4" aria-hidden />
          </button>
        </section>
      ))}
    </div>
  );
};
