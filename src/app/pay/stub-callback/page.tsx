/**
 * Stub payment callback page (dev/test only).
 *
 * When Paystack runs in stub mode, PaymentCapturePanel's "Complete Payment"
 * button opens {FRONTEND_URL}/pay/stub-callback?ref=<provider_reference> in a
 * new tab.  This page calls the backend's `/payments/stub/simulate` endpoint to
 * fire a simulated `charge.success` webhook (updates payment → success, order →
 * paid), then shows a confirmation the buyer can close.
 */
"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { authStore } from "@/lib/api/client";

export default function StubCallbackPage() {
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (!ref) {
      setState("error");
      setErrorMsg("Missing payment reference.");
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
    const token = authStore.getAccessToken();

    fetch(`${apiBase}/api/v1/payments/stub/simulate?ref=${encodeURIComponent(ref)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Backend returned ${res.status}: ${txt.slice(0, 200)}`);
        }
        setState("success");
      })
      .catch((err: Error) => {
        setState("error");
        setErrorMsg(err.message);
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center shadow-lg">
        {state === "loading" && (
          <>
            <div className="mb-4 flex justify-center">
              <Loader2 size={32} className="animate-spin text-[var(--color-primary)]" />
            </div>
            <h2 className="font-semibold text-[var(--color-foreground)] mb-2">
              Finalising payment…
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              Just a moment while we confirm your payment.
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle size={32} className="text-green-600" />
              </div>
            </div>
            <h2 className="font-semibold text-[var(--color-foreground)] mb-2">
              Payment Successful!
            </h2>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              Your order has been confirmed. You can close this tab and return to the
              chat to see your order confirmation.
            </p>
            <button
              onClick={() => window.close()}
              className="rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
            >
              Close tab
            </button>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle size={32} className="text-red-600" />
              </div>
            </div>
            <h2 className="font-semibold text-[var(--color-foreground)] mb-2">
              Payment could not be confirmed
            </h2>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              {errorMsg || "Something went wrong. Please try again."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
            >
              Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
}
