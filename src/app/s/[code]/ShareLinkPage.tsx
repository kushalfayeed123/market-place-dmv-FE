"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiError } from "@/lib/api/client";
import { Loader2 } from "lucide-react";

/**
 * Visitor landing for a shared link (/s/{code}).
 *
 * Resolves the code against the public backend endpoint, then forwards the
 * visitor to the main product page ("/") with the code stored so the agent
 * resolves it there: a product-set link renders a ProductGrid with exactly
 * those products; a store link renders the whole store. From there the normal
 * add-to-cart → checkout → payment flow is unchanged.
 */
export default function ShareLinkPage({ code }: { code: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function go() {
      try {
        // Validate the link exists (public, no auth) before routing.
        const resolved = await apiClient.resolveShareLink(code);
        if (cancelled) return;
        // Hand the code to the main page; it asks the agent to resolve the link.
        window.sessionStorage.setItem("mp_agent_resume_message", `Open this shared link: /s/${code}`);
        window.sessionStorage.setItem("mp_share_link_code", resolved.code);
        router.replace("/");
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setError("This link is not available or has been disabled.");
        } else {
          setError("Could not open this link right now. Please try again.");
        }
      }
    }
    go();
    return () => {
      cancelled = true;
    };
  }, [code, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-6">
        <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center shadow-[var(--shadow-md)]">
          <h1 className="mb-2 text-lg font-semibold text-[var(--color-foreground)]">Link unavailable</h1>
          <p className="text-sm text-[var(--color-muted)]">{error}</p>
          <a
            href="/"
            className="mt-6 inline-block rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
          >
            Go to the marketplace
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      <p className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Loader2 size={16} className="animate-spin" /> Opening shared link…
      </p>
    </div>
  );
}
