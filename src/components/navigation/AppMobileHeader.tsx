import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, X } from 'lucide-react';
import { paths } from '@/routes/paths';
import { useAppSelector } from '@/store/hooks';

type HeaderAction = 'menu' | 'close';
type HeaderPosition = 'fixed' | 'static';

interface AppMobileHeaderProps {
  title: string;
  action?: HeaderAction;
  actionLabel?: string;
  avatar?: ReactNode;
  position?: HeaderPosition;
  onActionPress?: () => void;
}

export const NotificationButton = () => {
  const navigate = useNavigate();
  const unreadCount = useAppSelector((state) => state.notificationList.unreadCount);

  return (
    <button
      className="relative grid size-11 shrink-0 place-items-center rounded-full border border-[#E5E7EB] bg-white text-[#123B8D] shadow-sm transition hover:border-[#B8C6E4] hover:bg-[#F8FAFE]"
      type="button"
      aria-label="Notifications"
      onClick={() => navigate(paths.notifications)}
    >
      <Bell className="size-5" aria-hidden />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[0.6rem] font-bold text-white ring-2 ring-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export const AppMobileHeader = ({
  title,
  action = 'menu',
  actionLabel,
  avatar,
  position = 'fixed',
  onActionPress,
}: AppMobileHeaderProps) => {
  const ActionIcon = action === 'close' ? X : Menu;
  const resolvedActionLabel = actionLabel ?? (action === 'close' ? 'Close menu' : 'Open menu');

  return (
    <header
      className={`${position === 'fixed' ? 'fixed inset-x-0 top-0' : 'relative'} z-40 flex min-h-16 items-center justify-between border-b border-[#E5E7EB] bg-white/95 px-4 py-3 backdrop-blur-xl`}
    >
      <div className="flex min-w-0 shrink-0 items-center gap-1.5">
        <button
          className="grid size-11 shrink-0 place-items-center rounded-full text-[#123B8D] transition hover:bg-[#EAF1FF]"
          type="button"
          aria-label={resolvedActionLabel}
          onClick={onActionPress}
        >
          <ActionIcon className={action === 'close' ? 'size-6' : 'size-7'} strokeWidth={action === 'close' ? 2.6 : 2} aria-hidden />
        </button>
        {avatar}
      </div>
      <h1 className="absolute left-1/2 max-w-[calc(100%-11rem)] -translate-x-1/2 truncate text-center text-xl font-extrabold text-[#0B1F4A]">
        {title}
      </h1>
      <NotificationButton />
    </header>
  );
};
