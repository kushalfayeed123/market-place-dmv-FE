"use client";

import { RefreshCw, LogOut, Bell, ChevronDown } from "lucide-react";
import { SECTIONS } from "./sections";

interface MerchantNavHeaderProps {
  merchantId: string;
  businessName: string;
  section: string;
  kycStatus?: string;
  onRefresh: () => void;
  onLogout: () => void;
}

/**
 * Top navigation bar for the merchant dashboard.
 *
 * Shows the current section title + hint, a KYC-status badge, a refresh
 * button, and a user menu (sign out / back to marketplace).
 */
export function MerchantNavHeader({
  businessName,
  section,
  kycStatus = "pending",
  onRefresh,
  onLogout,
}: MerchantNavHeaderProps) {
  const cfg = SECTIONS.find((s) => s.key === section);
  const label = cfg ? cfg.label : "Dashboard";
  const hint = cfg ? cfg.hint : "";

  const kycTone =
    kycStatus === "verified"
      ? "bg-[var(--color-success-bg)] text-[var(--color-success-fg)]"
      : kycStatus === "test_mode"
        ? "bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]"
        : kycStatus === "rejected"
          ? "bg-[var(--color-danger-bg)] text-[var(--color-danger-fg)]"
          : "bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]";

  return (
    <header className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-white px-5 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-[var(--color-foreground)]">
            {label}
          </h1>
          {kycStatus === "verified" && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${kycTone}`}
            >
              KYC {kycStatus}
            </span>
          )}
        </div>
        {hint && (
          <p className="text-sm text-[var(--color-muted)]">{hint}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          aria-label="Refresh"
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] hover:bg-[var(--color-border)]"
        >
          <RefreshCw size={12} />
          Refresh
        </button>

        <button
          aria-label="Notifications"
          className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-muted)] hover:bg-[var(--color-border)]"
        >
          <Bell size={14} />
        </button>

        <div className="flex items-center gap-2 border-l border-[var(--color-border)] pl-3">
          <span className="hidden text-sm font-medium text-[var(--color-foreground)] sm:block">
            {businessName}
          </span>
          <button
            onClick={onLogout}
            aria-label="Sign out"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] hover:bg-[var(--color-border)]"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">Sign out</span>
            <ChevronDown size={12} />
          </button>
        </div>
      </div>
    </header>
  );
}
