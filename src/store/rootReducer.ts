import { combineReducers } from '@reduxjs/toolkit';
import { appReducer } from './slices/appSlice';
import { authReducer } from './slices/authSlice';
import { churchReducer } from './slices/churchSlice';
import { memberReducer } from './slices/memberSlice';
import { notificationReducer } from './slices/notificationSlice';
import { profileReducer } from './slices/profileSlice';
import { userReducer } from './slices/userSlice';
import { walletReducer } from './slices/walletSlice';

export const rootReducer = combineReducers({
  app: appReducer,
  auth: authReducer,
  church: churchReducer,
  member: memberReducer,
  notifications: notificationReducer,
  profile: profileReducer,
  user: userReducer,
  wallet: walletReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
