"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { LoginModal } from "@/components/auth/LoginModal";
import { api, TOKEN_KEY } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  /** True until the stored token has been checked on first load. */
  loading: boolean;
  setSession: (token: string, user: User) => void;
  logout: () => void;
  becomeHost: () => Promise<void>;
  openLogin: () => void;
  /** Returns true when logged in; otherwise opens the login modal and returns false. */
  requireAuth: () => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  // On first load, swap a stored token for the user it belongs to (or drop it if invalid).
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    (token ? api.me() : Promise.resolve(null))
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const setSession = useCallback((token: string, u: User) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
    setLoginOpen(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const becomeHost = useCallback(async () => {
    setUser(await api.becomeHost());
  }, []);

  const openLogin = useCallback(() => setLoginOpen(true), []);

  const requireAuth = useCallback(() => {
    if (user) return true;
    setLoginOpen(true);
    return false;
  }, [user]);

  const value = useMemo(
    () => ({ user, loading, setSession, logout, becomeHost, openLogin, requireAuth }),
    [user, loading, setSession, logout, becomeHost, openLogin, requireAuth],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Mounted only while open, so its form state starts fresh each time. */}
      {loginOpen && <LoginModal open onClose={() => setLoginOpen(false)} onSuccess={setSession} />}
    </AuthContext.Provider>
  );
}
