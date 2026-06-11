import { combineReducers } from '@reduxjs/toolkit';
import { appReducer } from './slices/appSlice';
import { authReducer } from './slices/authSlice';
import { notificationReducer } from './slices/notificationSlice';
import { userReducer } from './slices/userSlice';

export const rootReducer = combineReducers({
  app: appReducer,
  auth: authReducer,
  notifications: notificationReducer,
  user: userReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
