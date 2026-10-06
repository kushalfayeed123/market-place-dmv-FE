"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export type AuthMode = "login" | "register";

export interface AuthFlowProps {
  /** Callback fired after a successful login or registration. */
  onSuccess?: () => void;
  /** Default mode to show on first render. */
  defaultMode?: AuthMode;
}

/**
 * Full authentication flow — toggles between Login and Register.
 * Lives at the /auth route so it is shareable and linkable.
 */
export function AuthFlow({ onSuccess, defaultMode = "login" }: AuthFlowProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();

  // If the user is already authenticated, redirect to the appropriate page
  // based on their role.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      const dest = user?.role === "merchant_owner"
        ? "/merchant/dashboard"
        : "/";
      router.replace(dest);
    }
  }, [isAuthenticated, loading, router, user?.role]);

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-10 text-[var(--color-muted)]">
        Checking session...
      </div>
    );
  }

  const handleSuccess = (role?: string) => {
    onSuccess?.();
    // Hard navigate so the layout-level AuthProvider picks up the
    // persisted session from sessionStorage.  Merchant owners go to
    // their dashboard (which may prompt for store setup); buyers go
    // to the marketplace home.
    router.replace(role === "merchant_owner" ? "/merchant/dashboard" : "/");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {mode === "login" ? (
        <LoginForm
          onSuccess={(role) => handleSuccess(role)}
          onSwitchToRegister={() => setMode("register")}
        />
      ) : (
        <RegisterForm
          onSuccess={(role) => handleSuccess(role)}
          onSwitchToLogin={() => setMode("login")}
        />
      )}
    </div>
  );
}