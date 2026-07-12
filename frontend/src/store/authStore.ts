import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authApi } from '@/api/services';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User | null) => void;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isDeveloper: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      setTokens: (access, refresh) => {
        localStorage.setItem('rrr_access_token', access);
        localStorage.setItem('rrr_refresh_token', refresh);
        set({ accessToken: access, refreshToken: refresh });
      },

      setUser: (user) => set({ user }),

      login: async (email, password, remember = false) => {
        set({ isLoading: true });
        try {
          const tokens = await authApi.login({ email, password, remember_me: remember });
          get().setTokens(tokens.access_token, tokens.refresh_token);
          const user = await authApi.me();
          set({ user, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          /* ignore */
        }
        localStorage.removeItem('rrr_access_token');
        localStorage.removeItem('rrr_refresh_token');
        set({ user: null, accessToken: null, refreshToken: null });
      },

      fetchMe: async () => {
        const token = localStorage.getItem('rrr_access_token');
        if (!token) {
          set({ user: null });
          return;
        }
        set({ isLoading: true });
        try {
          const user = await authApi.me();
          set({ user, accessToken: token, isLoading: false });
        } catch {
          set({ user: null, isLoading: false });
        }
      },

      isAdmin: () => {
        const u = get().user;
        if (!u) return false;
        if (u.is_superuser) return true;
        return u.roles.some((r) => r.name === 'admin' || r.name === 'manager');
      },

      isStaff: () => {
        const u = get().user;
        if (!u) return false;
        if (u.is_superuser) return true;
        return u.roles.some((r) => ['admin', 'manager', 'staff'].includes(r.name));
      },

      isDeveloper: () => {
        const u = get().user;
        if (!u) return false;
        if (u.is_superuser) return true;
        return u.roles.some((r) => r.name === 'admin' || r.name === 'developer');
      },
    }),
    {
      name: 'rrr-auth',
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
      }),
    }
  )
);
