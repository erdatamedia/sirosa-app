"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { type AuthUser, getMe } from "@/lib/auth-api";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("sirosa_token");
    document.cookie = "sirosa_token=; path=/; max-age=0";
    setUser(null);
    setToken(null);
  }, []);

  const setAuth = useCallback((t: string, u: AuthUser) => {
    localStorage.setItem("sirosa_token", t);
    // Also set cookie so middleware can read it (7 days)
    document.cookie = `sirosa_token=${t}; path=/; max-age=604800`;
    setToken(t);
    setUser(u);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("sirosa_token");
    if (!stored) {
      setLoading(false);
      return;
    }
    getMe(stored)
      .then((u) => {
        setToken(stored);
        setUser(u);
        document.cookie = `sirosa_token=${stored}; path=/; max-age=604800`;
      })
      .catch(() => {
        localStorage.removeItem("sirosa_token");
        document.cookie = "sirosa_token=; path=/; max-age=0";
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
