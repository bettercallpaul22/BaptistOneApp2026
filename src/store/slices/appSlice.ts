import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  globalLoading: boolean;
  themeMode: 'light' | 'dark' | 'system';
}

const initialState: AppState = {
  globalLoading: false,
  themeMode: 'system',
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    setThemeMode: (state, action: PayloadAction<AppState['themeMode']>) => {
      state.themeMode = action.payload;
    },
  },
});

export const { setGlobalLoading, setThemeMode } = appSlice.actions;
export const appReducer = appSlice.reducer;
