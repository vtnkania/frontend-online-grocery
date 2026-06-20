"use client";

import { create } from "zustand";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/auth-token";
import { getCurrentUser, loginUser } from "@/services/auth.service";
import type { FreshMartUser } from "@/types/user.type";

type AuthState = {
  user: FreshMartUser | null;
  loading: boolean;
  setUser: (user: FreshMartUser | null) => void;
  setSession: (token: string, user: FreshMartUser) => void;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<FreshMartUser>;
  logout: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setSession: (token, user) => {
    setStoredToken(token);
    set({ user, loading: false });
  },
  initialize: async () => {
    if (!getStoredToken()) {
      set({ user: null, loading: false });
      return;
    }
    try {
      set({ user: await getCurrentUser(), loading: false });
    } catch {
      clearStoredToken();
      set({ user: null, loading: false });
    }
  },
  login: async (email, password) => {
    const result = await loginUser(email, password);
    setStoredToken(result.accessToken);
    set({ user: result.user, loading: false });
    return result.user;
  },
  logout: () => {
    clearStoredToken();
    set({ user: null, loading: false });
  },
}));
