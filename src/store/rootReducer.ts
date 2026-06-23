import { combineReducers } from '@reduxjs/toolkit';
import { appReducer } from './slices/appSlice';
import { authReducer } from './slices/authSlice';
import { churchReducer } from './slices/churchSlice';
import { churchContentReducer } from './slices/churchContentSlice';
import { conventionReducer } from './slices/conventionSlice';
import { givingReducer } from './slices/givingSlice';
import { memberReducer } from './slices/memberSlice';
import { ministryReducer } from './slices/ministrySlice';
import { notificationReducer } from './slices/notificationSlice';
import { profileReducer } from './slices/profileSlice';
import { forumReducer } from './slices/forumSlice';
import { forumPostsSlice } from './slices/forumPostsSlice';
import { homeReducer } from './slices/homeSlice';
import { resourceReducer } from './slices/resourceSlice';
import { userReducer } from './slices/userSlice';
import { userAvatarUrlReducer } from './slices/userAvatarUrlSlice';
import { walletReducer } from './slices/walletSlice';
import { realtimeNotificationReducer } from './slices/realtimeNotificationSlice';

export const rootReducer = combineReducers({
  app: appReducer,
  auth: authReducer,
  church: churchReducer,
  churchContent: churchContentReducer,
  convention: conventionReducer,
  giving: givingReducer,
  member: memberReducer,
  ministry: ministryReducer,
  notifications: notificationReducer,
  realtimeNotification: realtimeNotificationReducer,
  profile: profileReducer,
  forum: forumReducer,
  forumPosts: forumPostsSlice.reducer,
  home: homeReducer,
  resource: resourceReducer,
  user: userReducer,
  userAvatarUrl: userAvatarUrlReducer,
  wallet: walletReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
