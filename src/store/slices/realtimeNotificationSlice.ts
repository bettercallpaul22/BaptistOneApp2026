import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import type { FilterCategory, RealtimeNotification } from '@/types/realtimeNotification';

interface RealtimeNotificationState {
  notifications: RealtimeNotification[];
  unreadCount: number;
  activeFilter: FilterCategory;
}

const initialState: RealtimeNotificationState = {
  notifications: [],
  unreadCount: 0,
  activeFilter: 'all',
};

const matchesFilter = (notification: RealtimeNotification, filter: FilterCategory): boolean => {
  if (filter === 'all') return true;
  if (filter === 'unread') return notification.readAt === null;
  return notification.resourceType === filter;
};

const realtimeNotificationSlice = createSlice({
  name: 'realtimeNotification',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<RealtimeNotification[]>) => {
      state.notifications = action.payload;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    setActiveFilter: (state, action: PayloadAction<FilterCategory>) => {
      state.activeFilter = action.payload;
    },
    upsertNotification: (state, action: PayloadAction<RealtimeNotification>) => {
      const incoming = action.payload;
      const existingIndex = state.notifications.findIndex((n) => n.id === incoming.id);

      if (existingIndex >= 0) {
        state.notifications[existingIndex] = incoming;
        return;
      }

      if (matchesFilter(incoming, state.activeFilter)) {
        state.notifications = [incoming, ...state.notifications];
      }
    },
    updateReadState: (
      state,
      action: PayloadAction<{ notificationId: string; readAt: string | null }>,
    ) => {
      const { notificationId, readAt } = action.payload;
      state.notifications = state.notifications
        .map((n) => (n.id === notificationId ? { ...n, readAt } : n))
        .filter((n) => (state.activeFilter === 'unread' ? n.readAt === null : true));
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
  },
});

export const { setNotifications, setUnreadCount, setActiveFilter, upsertNotification, updateReadState } =
  realtimeNotificationSlice.actions;
export const realtimeNotificationReducer = realtimeNotificationSlice.reducer;
