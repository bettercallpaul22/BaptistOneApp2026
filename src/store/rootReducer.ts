import { combineReducers } from '@reduxjs/toolkit';
import { appReducer } from './slices/appSlice';
import { authReducer } from './slices/authSlice';
import { churchReducer } from './slices/churchSlice';
import { churchContentReducer } from './slices/churchContentSlice';
import { givingReducer } from './slices/givingSlice';
import { memberReducer } from './slices/memberSlice';
import { ministryReducer } from './slices/ministrySlice';
import { notificationReducer } from './slices/notificationSlice';
import { profileReducer } from './slices/profileSlice';
import { forumReducer } from './slices/forumSlice';
import { forumPostsSlice } from './slices/forumPostsSlice';
import { homeReducer } from './slices/homeSlice';
import { userReducer } from './slices/userSlice';
import { walletReducer } from './slices/walletSlice';

export const rootReducer = combineReducers({
  app: appReducer,
  auth: authReducer,
  church: churchReducer,
  churchContent: churchContentReducer,
  giving: givingReducer,
  member: memberReducer,
  ministry: ministryReducer,
  notifications: notificationReducer,
  profile: profileReducer,
  forum: forumReducer,
  forumPosts: forumPostsSlice.reducer,
  home: homeReducer,
  user: userReducer,
  wallet: walletReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
