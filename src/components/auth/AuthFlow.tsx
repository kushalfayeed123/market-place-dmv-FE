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
  const { isAuthenticated, loading } = useAuth();

  // If the user is already authenticated, bounce them to the home page.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-10 text-[var(--color-muted)]">
        Checking session...
      </div>
    );
  }

  const handleSuccess = () => {
    onSuccess?.();
    // Hard navigate to home so the layout-level AuthProvider picks up
    // the persisted session from sessionStorage.
    router.replace("/");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {mode === "login" ? (
        <LoginForm
          onSuccess={() => handleSuccess()}
          onSwitchToRegister={() => setMode("register")}
        />
      ) : (
        <RegisterForm
          onSuccess={() => handleSuccess()}
          onSwitchToLogin={() => setMode("login")}
        />
      )}
    </div>
  );
}