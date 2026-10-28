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

  const destination = (role?: string) => {
    const requested = new URLSearchParams(window.location.search).get("returnTo");
    if (requested?.startsWith("/") && !requested.startsWith("//") && requested !== "/auth") {
      return requested;
    }
    return role === "merchant_owner" ? "/merchant/dashboard" : "/";
  };

  // Return to the page that requested sign-in, preserving the active conversation.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(destination(user?.role));
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
    router.replace(destination(role));
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