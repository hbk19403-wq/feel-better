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
    setCredentials: (state, action: PayloadAction<{ user: User; access_token: string; refresh_token: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.access_token;
      state.isAuthenticated = true;
      state.onboardingComplete = !!action.payload.user.age_segment;
      SecureStore.setItemAsync('refreshToken', action.payload.refresh_token);
      SecureStore.setItemAsync('accessToken', action.payload.access_token);
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

export const { setCredentials, updateUser, setOnboardingComplete, logout } = authSlice.actions;
export default authSlice.reducer;
