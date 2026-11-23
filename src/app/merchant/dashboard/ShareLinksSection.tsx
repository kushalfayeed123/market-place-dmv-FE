"use client";

import { useEffect, useState } from "react";
import { mreq } from "@/lib/api/merchant";
import type { ShareLinkResponse, ShareLinkResolveResponse } from "@/lib/api/client";
import { ShareLinkCard } from "@/components/catalog/ShareLinkCard";
import { LoadingSpinner } from "@/components/system/LoadingSpinner";

export function ShareLinksSection({ merchantId }: { merchantId: string }) {
  const [links, setLinks] = useState<ShareLinkResponse[]>([]);
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolved, setResolved] = useState<ShareLinkResolveResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await mreq<ShareLinkResponse[]>("GET", `/links/`);
        setLinks(data ?? []);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load share links.");
        console.error(e);
      }
    }
    load();
  }, [merchantId]);

  const handleCreate = async (payload: { store_id: string; product_ids?: string[]; title?: string }) => {
    setError(null);
    try {
      const data = await mreq<ShareLinkResponse>("POST", "/links/", { body: payload, idempotent: true });
      if (data) setLinks((prev) => [data, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create share link.");
      console.error(e);
    }
  };

  const handleResolve = async (code: string) => {
    setResolving(code);
    setResolved(null);
    setError(null);
    try {
      const data = await mreq<ShareLinkResolveResponse>("GET", `/links/public/${encodeURIComponent(code)}`);
      setResolved(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resolve share link.");
      console.error(e);
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-[var(--color-foreground)]">Share Links</h1>

      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 mb-6">
        <h2 className="font-medium mb-3">Create a share link</h2>
        <p className="text-xs text-[var(--color-muted)] mb-4">
          Choose a link type: <strong>Store link</strong> shows all active products in your store.
          <strong>Product-set link</strong> shows only the products you select.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Link title (optional)
              <input
                type="text"
                placeholder="e.g. Summer picks"
                className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                ref={el => (el && (el as any).focus?.() || el)}
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Select product IDs (comma-separated, omit for store link)
              <input
                type="text"
                placeholder="e.g. prod-1,prod-2"
                className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                ref={el => (el && (el as any).focus?.() || el)}
              />
            </label>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Leave blank for a store link (all active products).
            </p>
          </div>
          <button
            onClick={() => handleCreate({
              store_id: /* TODO: fetch merchant's primary store */ "",
              product_ids: [],
              title: "",
            })}
            className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Generate link
          </button>
        </div>
      </div>

      {resolving && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Resolving link…</p>
          <LoadingSpinner size={14} />
        </div>
      )}

      {resolved && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
          <h2 className="font-medium mb-4">
            {resolved.kind === "products"
              ? `Product set: ${resolved.title || "My products"}`
              : `Store: ${resolved.store?.name || "My store"}`
            }
          </h2>
          <p className="text-xs text-[var(--color-muted)] mb-4">
            {resolved.kind === "products"
              ? `Visitors see ${resolved.products.length} product${resolved.products.length !== 1 ? "s" : ""}.`
              : `Visitors see all active products in this store.`}
          </p>
          {resolved.kind === "products" && resolved.products.length > 0 && (
            <div className="space-y-3">
              {resolved.products.map((p, i) => (
                <ShareLinkCard
                  key={i}
                  url={resolved.url || ""}
                  title={p.title}
                  kind="products"
                  product_count={resolved.products.length}
                />
              ))}
            </div>
          )}
          {resolved.kind === "store" && (
            <>
              <p className="text-sm text-[var(--color-muted)] mb-4">
                Share this URL with anyone — visitors see all active products in your store.
              </p>
              <ShareLinkCard
                url={resolved.url || ""}
                title={resolved.title ?? undefined}
                kind="store"
              />
            </>
          )}
          <button
            onClick={() => window.open(resolved.url || "", "_blank", "noopener,noreferrer")}
            className="mt-4 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
          >
            Open in new tab
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-fg)]">
          {error}
        </div>
      )}

      {links.length === 0 && <p className="text-sm text-[var(--color-muted)]">No share links yet. Create one above.</p>}
      {links.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link) => (
            <ShareLinkCard
              key={link.code}
              url={link.url}
              title={link.title ?? undefined}
              kind={link.product_ids?.length ? "products" : "store"}
              product_count={link.product_ids?.length ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}