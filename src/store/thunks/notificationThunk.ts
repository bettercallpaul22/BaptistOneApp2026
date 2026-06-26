import { createAsyncThunk } from '@reduxjs/toolkit';
import { toApiError } from '@/services/api/responseHandler';
import { notificationService } from '@/services/notification/notificationService';
import type { RootState } from '@/store/rootReducer';
import type {
  NotificationListFilterCategory,
  NotificationListResponse,
} from '@/types/notificationList';

export const fetchNotificationsThunk = createAsyncThunk<
  NotificationListResponse['data'],
  { filter: NotificationListFilterCategory; isRefresh?: boolean },
  { rejectValue: string; state: RootState }
>(
  'notificationList/fetchNotifications',
  async ({ filter }, { rejectWithValue }) => {
    try {
      const response = await notificationService.getNotifications(1, 20, filter);
      return response.data;
    } catch (error) {
      return rejectWithValue(toApiError(error).message);
    }
  },
);

export const loadMoreNotificationsThunk = createAsyncThunk<
  NotificationListResponse['data'],
  void,
  { rejectValue: string; state: RootState }
>(
  'notificationList/loadMoreNotifications',
  async (_, { getState, rejectWithValue }) => {
    const state = (getState() as RootState).notificationList;
    const { currentPage, activeFilter, hasMore } = state;

    if (!hasMore) return rejectWithValue('No more pages');

    const nextPage = currentPage + 1;
    try {
      const response = await notificationService.getNotifications(nextPage, 20, activeFilter);
      return response.data;
    } catch (error) {
      return rejectWithValue(toApiError(error).message);
    }
  },
);

export const markNotificationAsReadThunk = createAsyncThunk<
  { notificationId: string },
  { notificationId: string },
  { rejectValue: string }
>(
  'notificationList/markAsRead',
  async ({ notificationId }, { rejectWithValue }) => {
    try {
      await notificationService.markAsRead(notificationId);
      return { notificationId };
    } catch (error) {
      return rejectWithValue(toApiError(error).message);
    }
  },
);

export const markAllNotificationsAsReadThunk = createAsyncThunk<
  boolean,
  void,
  { rejectValue: string }
>(
  'notificationList/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead();
      return true;
    } catch (error) {
      return rejectWithValue(toApiError(error).message);
    }
  },
);

export const deleteNotificationThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'notificationList/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationService.deleteNotification(notificationId);
      return notificationId;
    } catch (error) {
      return rejectWithValue(toApiError(error).message);
    }
  },
);

export const fetchUnreadCountThunk = createAsyncThunk<
  number,
  void,
  { rejectValue: string }
>(
  'notificationList/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getUnreadCount();
      return response.data.count;
    } catch (error) {
      return rejectWithValue(toApiError(error).message);
    }
  },
);
