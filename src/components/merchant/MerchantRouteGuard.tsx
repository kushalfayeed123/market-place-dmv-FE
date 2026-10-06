"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Roles that are allowed to access the merchant dashboard.
 * Mirrors `models/user.py` UserRole (merchant_owner / merchant_staff).
 */
const MERCHANT_ROLES = new Set(["merchant_owner", "merchant_staff"]);

/**
 * Route guard for merchant-only pages.
 *
 * - While auth state is still resolving (GET /me in-flight) → shows a spinner.
 * - After resolution:
 *   • Unauthenticated  → redirect to /auth
 *   • Authenticated but not a merchant → redirect to /
 *   • Authenticated merchant → render children
 *
 * Usage (inside a Next.js App Router Server Component page):
 *   <MerchantRouteGuard>
 *     <MerchantDashboardContent … />
 *   </MerchantRouteGate>
 */
export function MerchantRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace("/auth");
      return;
    }

    if (!user || !MERCHANT_ROLES.has(user.role)) {
      // Normal buyers (or any non-merchant) are bounced to the marketplace.
      router.replace("/");
    }
  }, [user, isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-[var(--color-muted)]">
          <Loader2 size={16} className="animate-spin" />
          <span>Checking permissions…</span>
        </div>
      </div>
    );
  }

  // Still loading, or redirected — render nothing until the guard resolves.
  if (!isAuthenticated || !user || !MERCHANT_ROLES.has(user.role)) {
    return null;
  }

  return <>{children}</>;
}
