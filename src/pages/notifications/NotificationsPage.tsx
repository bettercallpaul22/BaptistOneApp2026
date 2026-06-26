import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell,
  BellOff,
  ChevronDown,
  CreditCard,
  Church,
  MessageSquare,
  RefreshCw,
  Trash2,
  Users,
  CheckCheck,
} from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppLoader, AppModal } from '@/components/feedback';
import { AppShell } from '@/layouts/AppShell';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setActiveFilter,
  clearNotifications,
} from '@/store/slices/notificationListSlice';
import {
  fetchNotificationsThunk,
  loadMoreNotificationsThunk,
  markNotificationAsReadThunk,
  markAllNotificationsAsReadThunk,
  deleteNotificationThunk,
  fetchUnreadCountThunk,
} from '@/store/thunks/notificationThunk';
import type {
  NotificationListItem,
  NotificationListFilterCategory,
} from '@/types/notificationList';

const FILTER_TABS: { label: string; value: NotificationListFilterCategory }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Members', value: 'member' },
  { label: 'Finance', value: 'transaction' },
  { label: 'Church', value: 'church' },
  { label: 'Pastor', value: 'pastor' },
  { label: 'Forum', value: 'forum' },
  { label: 'Wallet', value: 'wallet' },
  { label: 'Account', value: 'user' },
];

function formatRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diff / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getNotificationIcon(resourceType: string) {
  if (resourceType === 'transaction' || resourceType === 'wallet')
    return { Icon: CreditCard, colorClass: 'text-[#123B8D] bg-[#EAF1FF]' };
  if (resourceType === 'church' || resourceType === 'pastor')
    return { Icon: Church, colorClass: 'text-[#123B8D] bg-[#EAF1FF]' };
  if (resourceType === 'forum')
    return { Icon: MessageSquare, colorClass: 'text-[#123B8D] bg-[#EAF1FF]' };
  if (resourceType === 'member' || resourceType === 'user')
    return { Icon: Users, colorClass: 'text-[#123B8D] bg-[#EAF1FF]' };
  return { Icon: Bell, colorClass: 'text-[#79859A] bg-[#F8FAFC]' };
}

function FilterDropdown({
  activeFilter,
  onChange,
}: {
  activeFilter: NotificationListFilterCategory;
  onChange: (value: NotificationListFilterCategory) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeLabel = FILTER_TABS.find((t) => t.value === activeFilter)?.label ?? 'All';

  return (
    <div className="relative mx-4 mb-3">
      <button
        className="flex w-full items-center justify-between rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 shadow-sm transition hover:border-[#B8C6E4]"
        type="button"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span className="size-2 rounded-full bg-[#D4A017]" />
          <div>
            <AppText variant="caption" color="textMuted" weight="bold">
              FILTER BY
            </AppText>
            <AppText variant="bodyMedium" weight="bold">
              {activeLabel}
            </AppText>
          </div>
        </div>
        <ChevronDown
          className={`size-5 text-[#123B8D] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-xl border-2 border-[#E5E7EB] bg-white shadow-[0_12px_28px_rgba(11,31,74,0.12)]">
            <div className="max-h-64 overflow-y-auto">
              {FILTER_TABS.map((tab, i) => {
                const isActive = activeFilter === tab.value;
                return (
                  <button
                    key={tab.value}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      i < FILTER_TABS.length - 1 ? 'border-b border-[#F1F5F9]' : ''
                    } ${isActive ? 'bg-[#F8F5EB]' : 'hover:bg-slate-50'}`}
                    type="button"
                    onClick={() => {
                      onChange(tab.value);
                      setOpen(false);
                    }}
                  >
                    {isActive && <span className="h-6 w-0.5 rounded-full bg-[#D4A017]" />}
                    <span className={`flex-1 text-sm ${isActive ? 'font-bold text-[#0B1F4A]' : 'font-medium text-[#46556E]'}`}>
                      {tab.label}
                    </span>
                    {isActive && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-[#D4A017]">
                        <CheckCheck className="size-3 text-white" aria-hidden />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationCard({
  notification,
  onOpen,
  onDelete,
}: {
  notification: NotificationListItem;
  onOpen: (n: NotificationListItem) => void;
  onDelete: (id: string) => void;
}) {
  const isRead = notification.readAt !== null;
  const { Icon, colorClass } = getNotificationIcon(notification.resourceType);

  return (
    <div
      className={`group flex items-start gap-3 border-b border-[#F1F5F9] px-4 py-4 transition-colors hover:bg-slate-50/50 ${
        !isRead ? 'border-l-4 border-l-[#D4A017]' : 'border-l-4 border-l-transparent'
      }`}
    >
      <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${colorClass}`}>
        <Icon className="size-5" aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-start justify-between gap-2">
          <AppText
            variant="bodyMedium"
            weight={isRead ? 'medium' : 'bold'}
            className={`truncate ${isRead ? 'text-[#46556E]' : 'text-[#0B1F4A]'}`}
          >
            {notification.title}
          </AppText>
          <AppText variant="caption" color="textMuted" className="shrink-0">
            {formatRelativeTime(notification.createdAt)}
          </AppText>
        </div>

        <AppText
          variant="bodySmall"
          className={`line-clamp-2 ${isRead ? 'text-[#79859A]' : 'text-[#46556E]'}`}
        >
          {notification.body}
        </AppText>

        {notification.channels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {notification.channels.map((ch) => (
              <span
                key={ch}
                className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[#123B8D]"
              >
                {ch.replace('_', ' ')}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          className="grid size-8 place-items-center rounded-lg text-[#79859A] transition-colors hover:bg-red-50 hover:text-red-600"
          type="button"
          aria-label="Delete notification"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const {
    notifications,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    activeFilter,
    unreadCount,
    error,
    isMarkingAllRead,
  } = useAppSelector((state) => state.notificationList);

  const [selectedNotification, setSelectedNotification] = useState<NotificationListItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchNotificationsThunk({ filter: activeFilter }));
    dispatch(fetchUnreadCountThunk());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          dispatch(loadMoreNotificationsThunk());
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [dispatch, hasMore, isLoadingMore, isLoading]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchNotificationsThunk({ filter: activeFilter, isRefresh: true }));
    dispatch(fetchUnreadCountThunk());
  }, [activeFilter, dispatch]);

  const handleFilterChange = useCallback(
    (value: NotificationListFilterCategory) => {
      dispatch(clearNotifications());
      dispatch(setActiveFilter(value));
      dispatch(fetchNotificationsThunk({ filter: value }));
    },
    [dispatch],
  );

  const handleMarkAllRead = useCallback(() => {
    dispatch(markAllNotificationsAsReadThunk());
  }, [dispatch]);

  const handleOpen = useCallback(
    (item: NotificationListItem) => {
      if (!item.readAt) {
        dispatch(markNotificationAsReadThunk({ notificationId: item.id }));
      }
      setSelectedNotification(item);
      setShowModal(true);
    },
    [dispatch],
  );

  const handleDelete = useCallback(
    (id: string) => {
      dispatch(deleteNotificationThunk(id));
    },
    [dispatch],
  );

  const handleRetry = useCallback(() => {
    dispatch(fetchNotificationsThunk({ filter: activeFilter }));
  }, [activeFilter, dispatch]);

  return (
    <AppShell>
      <main className="mx-auto grid w-full max-w-2xl gap-0 px-0 py-0 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-4">
          <div>
            {unreadCount > 0 && (
              <AppText variant="caption" weight="bold" color="#D4A017">
                {unreadCount} unread
              </AppText>
            )}
          </div>
          {unreadCount > 0 && (
            <AppButton
              variant="ghost"
              size="sm"
              loading={isMarkingAllRead}
              onClick={handleMarkAllRead}
            >
              Mark all read
            </AppButton>
          )}
        </div>

        {/* Filter */}
        <div className="pt-3">
          <FilterDropdown activeFilter={activeFilter} onChange={handleFilterChange} />
        </div>

        {/* Refresh button */}
        <div className="flex items-center justify-between px-4 pb-2">
          <AppText variant="caption" color="textMuted">
            Pull to refresh
          </AppText>
          <button
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#123B8D] transition-colors hover:bg-[#EAF1FF]"
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Content */}
        {isLoading && notifications.length === 0 ? (
          <div className="grid min-h-[50vh] place-items-center">
            <AppLoader label="Loading notifications" />
          </div>
        ) : error && notifications.length === 0 ? (
          <div className="grid min-h-[50vh] place-items-center px-4">
            <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
                <BellOff className="size-6" aria-hidden />
              </span>
              <div className="grid gap-1">
                <AppText variant="h5" color="#991B1B" align="center">
                  Something went wrong
                </AppText>
                <AppText variant="bodySmall" color="#B91C1C" align="center">
                  {error}
                </AppText>
              </div>
              <AppButton
                leftIcon={<RefreshCw className="size-4" aria-hidden />}
                loading={isLoading}
                onClick={handleRetry}
              >
                Retry
              </AppButton>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="grid min-h-[50vh] place-items-center px-4">
            <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-[#EAF1FF] text-[#D4A017]">
                <Bell className="size-7" aria-hidden />
              </span>
              <div className="grid gap-1">
                <AppText variant="h5" align="center">
                  No notifications
                </AppText>
                <AppText variant="bodySmall" color="textSecondary" align="center">
                  {activeFilter !== 'all'
                    ? `No ${activeFilter} notifications yet.`
                    : 'You\'re all caught up! Check back later.'}
                </AppText>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onOpen={handleOpen}
                onDelete={handleDelete}
              />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />

            {isLoadingMore && (
              <div className="py-6">
                <AppLoader label="Loading more" />
              </div>
            )}

            {!hasMore && notifications.length > 0 && (
              <div className="py-6 text-center">
                <AppText variant="caption" color="textMuted">
                  No more notifications
                </AppText>
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        <AppModal
          open={showModal}
          title={selectedNotification?.title}
          onClose={() => setShowModal(false)}
        >
          {selectedNotification && (
            <div className="grid gap-4">
              <AppText variant="caption" color="textMuted">
                {formatRelativeTime(selectedNotification.createdAt)}
              </AppText>
              <AppText variant="bodyMedium" className="leading-relaxed">
                {selectedNotification.body}
              </AppText>
              {selectedNotification.channels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {selectedNotification.channels.map((ch) => (
                    <span
                      key={ch}
                      className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[#123B8D]"
                    >
                      {ch.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </AppModal>
      </main>
    </AppShell>
  );
}
