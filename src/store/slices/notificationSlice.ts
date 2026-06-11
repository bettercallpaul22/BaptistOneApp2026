import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

const notificationSlice = createSlice({
  name: 'notification',
  initialState: [] as Notification[],
  reducers: {
    pushNotification: {
      reducer: (state, action: PayloadAction<Notification>) => {
        state.push(action.payload);
      },
      prepare: (payload: Omit<Notification, 'id'>) => ({
        payload: {
          id: nanoid(),
          ...payload,
        },
      }),
    },
    removeNotification: (state, action: PayloadAction<string>) => state.filter((item) => item.id !== action.payload),
    clearNotifications: () => [],
  },
});

export const { clearNotifications, pushNotification, removeNotification } = notificationSlice.actions;
export const notificationReducer = notificationSlice.reducer;
