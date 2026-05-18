import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      remember: false,
      isAuthenticated: false,
      login: ({ user, token, remember }) => set({ user, token, remember, isAuthenticated: Boolean(token) }),
      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
      logout: () => set({ user: null, token: null, remember: false, isAuthenticated: false }),
    }),
    {
      name: 'iox-exchange-auth',
      onRehydrateStorage: () => (state) => {
        if (state?.token === 'demo.jwt.token') state.logout();
      },
    },
  ),
);
