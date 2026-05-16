'use client';

import { create } from 'zustand';
import { apiFetch } from '@/lib/api';
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  persistAuthSession,
} from '@/lib/auth';
import { disconnectSocket } from '@/lib/socket';
import type { User } from '@/types/user';

interface AuthResponse {
  accessToken: string;
  user: User;
}

interface AuthState {
  user: User | null;
  token: string | null;
  initialized: boolean;
  loading: boolean;
  bootstrap: () => Promise<void>;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    email: string;
    username: string;
    displayName: string;
    password: string;
    avatarUrl?: string;
  }) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  initialized: false,
  loading: false,
  bootstrap: async () => {
    if (get().initialized) {
      return;
    }

    const token = getStoredToken();
    const cachedUser = getStoredUser();

    if (!token) {
      set({ initialized: true });
      return;
    }

    set({
      token,
      user: cachedUser,
      loading: true,
    });

    try {
      const user = await apiFetch<User>('/auth/me', {
        token,
      });
      persistAuthSession(token, user);
      set({ user, token, initialized: true, loading: false });
    } catch {
      clearAuthSession();
      set({ user: null, token: null, initialized: true, loading: false });
    }
  },
  login: async (payload) => {
    set({ loading: true });
    try {
      const response = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: payload,
      });

      persistAuthSession(response.accessToken, response.user);
      set({
        user: response.user,
        token: response.accessToken,
        initialized: true,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  register: async (payload) => {
    set({ loading: true });
    try {
      const response = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: payload,
      });

      persistAuthSession(response.accessToken, response.user);
      set({
        user: response.user,
        token: response.accessToken,
        initialized: true,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  setUser: (user) => {
    const token = get().token;
    if (token) {
      persistAuthSession(token, user);
    }

    set({ user });
  },
  logout: () => {
    clearAuthSession();
    disconnectSocket();
    set({ user: null, token: null, initialized: true, loading: false });
  },
}));
