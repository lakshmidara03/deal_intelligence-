'use client';

import { create } from 'zustand';
import type { Account } from './types';

type AuthState = {
  account: Account | null;
  hasHydrated: boolean;
  setAccount: (account: Account | null) => void;
  hydrate: () => void;
  logout: () => void;
};

const sessionKey = 'deal-intelligence-account';

export const useAuthStore = create<AuthState>((set) => ({
  account: null,
  hasHydrated: false,
  setAccount: (account) => {
    if (typeof window !== 'undefined') {
      if (account) {
        window.localStorage.setItem(sessionKey, JSON.stringify(account));
      } else {
        window.localStorage.removeItem(sessionKey);
      }
    }
    set({ account });
  },
  hydrate: () => {
    if (typeof window === 'undefined') {
      return;
    }

    const raw = window.localStorage.getItem(sessionKey);
    set({ account: raw ? (JSON.parse(raw) as Account) : null, hasHydrated: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(sessionKey);
    }
    set({ account: null });
  }
}));
