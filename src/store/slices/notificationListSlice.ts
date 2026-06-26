import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import type {
  NotificationListItem,
  NotificationListFilterCategory,
  NotificationListMeta,
} from '@/types/notificationList';
import {
  fetchNotificationsThunk,
  loadMoreNotificationsThunk,
  markNotificationAsReadThunk,
  markAllNotificationsAsReadThunk,
  deleteNotificationThunk,
  fetchUnreadCountThunk,
} from '@/store/thunks/notificationThunk';

interface NotificationListState {
  notifications: NotificationListItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  total: number;
  hasMore: boolean;
  activeFilter: NotificationListFilterCategory;
  unreadCount: number;
  isMarkingAllRead: boolean;
}

const initialState: NotificationListState = {
  notifications: [],
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  total: 0,
  hasMore: false,
  activeFilter: 'all',
  unreadCount: 0,
  isMarkingAllRead: false,
};

const notificationListSlice = createSlice({
  name: 'notificationList',
  initialState,
  reducers: {
    setActiveFilter: (state, action: PayloadAction<NotificationListFilterCategory>) => {
      if (state.activeFilter === action.payload) return;
      state.activeFilter = action.payload;
      state.notifications = [];
      state.currentPage = 1;
      state.totalPages = 1;
      state.total = 0;
      state.hasMore = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.currentPage = 1;
      state.totalPages = 1;
      state.total = 0;
      state.hasMore = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchNotificationsThunk
    builder
      .addCase(fetchNotificationsThunk.pending, (state, action) => {
        state.error = null;
        if (action.meta.arg.isRefresh) {
          state.isRefreshing = true;
        } else {
          state.isLoading = true;
        }
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.notifications = action.payload.items;
        state.currentPage = action.payload.meta.page;
        state.totalPages = action.payload.meta.totalPages;
        state.total = action.payload.meta.total;
        state.hasMore = action.payload.meta.page < action.payload.meta.totalPages;
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.payload ?? 'Failed to fetch notifications.';
      });

    // loadMoreNotificationsThunk
    builder
      .addCase(loadMoreNotificationsThunk.pending, (state) => {
        state.isLoadingMore = true;
        state.error = null;
      })
      .addCase(loadMoreNotificationsThunk.fulfilled, (state, action) => {
        state.isLoadingMore = false;
        const existingIds = new Set(state.notifications.map((n) => n.id));
        const newItems = action.payload.items.filter((n) => !existingIds.has(n.id));
        state.notifications = [...state.notifications, ...newItems];
        state.currentPage = action.payload.meta.page;
        state.totalPages = action.payload.meta.totalPages;
        state.total = action.payload.meta.total;
        state.hasMore = action.payload.meta.page < action.payload.meta.totalPages;
      })
      .addCase(loadMoreNotificationsThunk.rejected, (state, action) => {
        state.isLoadingMore = false;
        state.error = action.payload ?? 'Failed to load more notifications.';
      });

    // markNotificationAsReadThunk
    builder
      .addCase(markNotificationAsReadThunk.fulfilled, (state, action) => {
        const { notificationId } = action.payload;
        state.notifications = state.notifications.filter((n) => n.id !== notificationId);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(markNotificationAsReadThunk.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to mark notification as read.';
      });

    // markAllNotificationsAsReadThunk
    builder
      .addCase(markAllNotificationsAsReadThunk.pending, (state) => {
        state.isMarkingAllRead = true;
        state.error = null;
      })
      .addCase(markAllNotificationsAsReadThunk.fulfilled, (state) => {
        state.isMarkingAllRead = false;
        const now = new Date().toISOString();
        state.notifications = state.notifications.map((n) => ({
          ...n,
          readAt: n.readAt ?? now,
        }));
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsAsReadThunk.rejected, (state, action) => {
        state.isMarkingAllRead = false;
        state.error = action.payload ?? 'Failed to mark all as read.';
      });

    // deleteNotificationThunk
    builder
      .addCase(deleteNotificationThunk.fulfilled, (state, action) => {
        state.notifications = state.notifications.filter((n) => n.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteNotificationThunk.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to delete notification.';
      });

    // fetchUnreadCountThunk
    builder.addCase(fetchUnreadCountThunk.fulfilled, (state, action) => {
      state.unreadCount = action.payload;
    });

    // Reset on logout
    builder.addCase(logout, () => initialState);
  },
});

export const { setActiveFilter, clearError, clearNotifications } = notificationListSlice.actions;
export const notificationListReducer = notificationListSlice.reducer;
