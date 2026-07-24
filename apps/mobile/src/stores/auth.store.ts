import { create } from 'zustand';
import { secureStorage, StorageKeys } from '@/lib/storage';

export interface AuthUser {
  id: string;
  email: string | null;
  privyId: string;
  role: string;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  // Actions
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  setAuth: (token, user) => {
    // Persist to secure storage
    secureStorage.set(StorageKeys.AUTH_TOKEN, token);
    secureStorage.set(StorageKeys.USER_ID, user.id);
    if (user.email) {
      secureStorage.set(StorageKeys.USER_EMAIL, user.email);
    }
    set({ token, user, isAuthenticated: true });
  },

  clearAuth: () => {
    secureStorage.delete(StorageKeys.AUTH_TOKEN);
    secureStorage.delete(StorageKeys.USER_ID);
    secureStorage.delete(StorageKeys.USER_EMAIL);
    set({ token: null, user: null, isAuthenticated: false });
  },

  hydrate: () => {
    const token = secureStorage.get(StorageKeys.AUTH_TOKEN);
    const userId = secureStorage.get(StorageKeys.USER_ID);
    const userEmail = secureStorage.get(StorageKeys.USER_EMAIL);

    if (token && userId) {
      set({
        token,
        user: {
          id: userId,
          email: userEmail ?? null,
          privyId: userId,
          role: 'USER',
        },
        isAuthenticated: true,
        isHydrated: true,
      });
    } else {
      set({ isHydrated: true });
    }
  },
}));
