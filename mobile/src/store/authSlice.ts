import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  age_segment: string | null;
  profession: string | null;
  language_preference: string;
  anonymous_mode: boolean;
  subscription_plan: string;
  is_minor: boolean;
  avatar_url: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  onboardingComplete: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Accepts the backend's response shape ({ user, accessToken, refreshToken }),
    // tolerating snake_case too for safety.
    setCredentials: (state, action: PayloadAction<any>) => {
      const p = action.payload || {};
      const accessToken = p.accessToken ?? p.access_token ?? null;
      const refreshToken = p.refreshToken ?? p.refresh_token ?? null;
      state.user = p.user;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.onboardingComplete = !!p.user?.age_segment;
      if (refreshToken) SecureStore.setItemAsync('refreshToken', refreshToken);
      if (accessToken) SecureStore.setItemAsync('accessToken', accessToken);
    },
    // Restores just the tokens into state (app boot + after a silent refresh).
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken?: string | null }>) => {
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      SecureStore.setItemAsync('accessToken', action.payload.accessToken);
      if (action.payload.refreshToken) SecureStore.setItemAsync('refreshToken', action.payload.refreshToken);
    },
    // Populates the user after a boot-time /users/me rehydrate.
    hydrateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.onboardingComplete = !!action.payload.age_segment;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) state.user = { ...state.user, ...action.payload };
      if (action.payload.age_segment) state.onboardingComplete = true;
    },
    setOnboardingComplete: (state) => {
      state.onboardingComplete = true;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.onboardingComplete = false;
      SecureStore.deleteItemAsync('refreshToken');
      SecureStore.deleteItemAsync('accessToken');
    },
  },
});

export const { setCredentials, setTokens, hydrateUser, updateUser, setOnboardingComplete, logout } = authSlice.actions;
export default authSlice.reducer;
