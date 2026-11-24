"use client";

import { useState } from "react";
import { Check, Copy, Link2, Store, Package } from "lucide-react";
import type { ShareLinkDirectiveProps } from "./directives";

/**
 * Build the shareable URL on the client from the current origin, so the link
 * always matches the port the app is actually served on (dev runs on 8443,
 * prod on 443, etc.) instead of whatever the backend guessed.
 */
function shareUrl(code: string | undefined, fallbackUrl: string): string {
  if (typeof window === "undefined") return fallbackUrl;
  if (!code) return fallbackUrl;
  return `${window.location.origin}/s/${code}`;
}

/**
 * Renders a merchant-generated share link (store or product-set) with a
 * copy-to-clipboard button. Reuses the existing card chrome so it blends with
 * the other agent directives.
 */
export function ShareLinkCard({ url, title, kind, code, product_count }: ShareLinkDirectiveProps) {
  const [copied, setCopied] = useState(false);
  const link = shareUrl(code, url);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable (permissions) — fall back to selecting the text.
      const el = document.getElementById(`share-link-input-${link.length}`);
      if (el instanceof HTMLInputElement) {
        el.focus();
        el.select();
      }
    }
  }

  const isStore = kind !== "products";
  const Icon = isStore ? Store : Package;

  return (
    <div className="max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--color-foreground)]">
            {title || (isStore ? "Store link" : "Product link")}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            {isStore
              ? "Visitors see all products in this store."
              : `Visitors see ${product_count ?? ""} product${(product_count ?? 0) === 1 ? "" : "s"} in this link.`}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Link2 size={14} className="shrink-0 text-[var(--color-muted)]" />
        <input
          id={`share-link-input-${link.length}`}
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Share link URL"
          className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-slate-50 px-3 text-xs text-[var(--color-foreground)] outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)]"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
