"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiClient, authStore } from "@/lib/api/client";

/**
 * The authenticated user object stored in React context + sessionStorage.
 * Mirrors the backend UserResponse (GET /me) and the `user` field on
 * TokenResponse from /auth/login and /auth/register.
 */
export interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  status?: string;
  avatar_url?: string | null;
}

/** Payload accepted by apiClient.register() — matches RegisterRequest. */
export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

/**
 * Normalises the `user: dict` payload returned by the backend into AuthUser.
 * The backend returns a dict on TokenResponse and a full UserResponse on /me.
 * We coalesce fields defensively because the dict shape can vary by endpoint.
 */
function normalizeUser(raw: Record<string, unknown>): AuthUser {
  return {
    id: (raw.id as string) ?? (raw.user_id as string) ?? "",
    email: (raw.email as string) ?? "",
    first_name: (raw.first_name as string) ?? undefined,
    last_name: (raw.last_name as string) ?? undefined,
    role: (raw.role as string) ?? "buyer",
    status: (raw.status as string) ?? undefined,
    avatar_url: (raw.avatar_url as string) ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Re-validate the session against the backend (GET /me).
   * If the refresh-token is still valid the access token is rotated
   * transparently inside apiClient.
   */
  const refreshUser = async () => {
    try {
      const raw = await apiClient.getMe();
      const u = normalizeUser(raw as unknown as Record<string, unknown>);
      setUser(u);
      sessionStorage.setItem("mp_user", JSON.stringify(u));
    } catch {
      authStore.clear();
      setUser(null);
      sessionStorage.removeItem("mp_user");
    }
  };

  // ── On mount: restore from sessionStorage, then validate ──
  useEffect(() => {
    const stored = sessionStorage.getItem("mp_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored) as AuthUser);
      } catch {
        sessionStorage.removeItem("mp_user");
      }
    }
    // Validate against backend in the background
    refreshUser().finally(() => setLoading(false));
  }, []);

  // ── Mutations ──

    const login = async (email: string, password: string) => {
    const data = await apiClient.login(email, password);
    const u = normalizeUser(data.user as unknown as Record<string, unknown>);
    setUser(u);
    sessionStorage.setItem("mp_user", JSON.stringify(u));
    return u;
  };

    const register = async (payload: RegisterData) => {
    const data = await apiClient.register(payload);
    const u = normalizeUser(data.user as unknown as Record<string, unknown>);
    setUser(u);
    sessionStorage.setItem("mp_user", JSON.stringify(u));
    return u;
  };

  const logout = async () => {
    await apiClient.logout();
    authStore.clear();
    setUser(null);
    sessionStorage.removeItem("mp_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}