'use client';

import { create } from 'zustand';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 'user-demo-1',
    name: 'Hoang Nguyen',
    email: 'hoang@framelab.dev',
    role: 'CUSTOMER',
  },
  isAuthenticated: true,
  isLoading: false,
  token: 'mock-jwt-token-12345',

  login: async (email, password) => {
    set({ isLoading: true });
    // Simulate login network call
    await new Promise((res) => setTimeout(res, 400));
    if (password.length < 4) {
      set({ isLoading: false });
      return false;
    }
    const user: User = {
      id: `usr-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: 'CUSTOMER',
    };
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_token', 'mock-session-jwt');
    }
    set({ user, isAuthenticated: true, isLoading: false, token: 'mock-session-jwt' });
    return true;
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    await new Promise((res) => setTimeout(res, 500));
    if (password.length < 4) {
      set({ isLoading: false });
      return false;
    }
    const user: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role: 'CUSTOMER',
    };
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_token', 'mock-session-jwt');
    }
    set({ user, isAuthenticated: true, isLoading: false, token: 'mock-session-jwt' });
    return true;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
    }
    set({ user: null, isAuthenticated: false, token: null });
  },

  updateUser: (data) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },
}));
