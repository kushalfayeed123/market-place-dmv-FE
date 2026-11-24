"use client";

import { useEffect, useState } from "react";
import { mreq } from "@/lib/api/merchant";
import type {
  ShareLinkResponse,
  ShareLinkResolveResponse,
  StoreResponse,
  Product as ApiProduct,
} from "@/lib/api/client";
import { ShareLinkCard } from "@/components/catalog/ShareLinkCard";
import { LoadingSpinner } from "@/components/system/LoadingSpinner";

export function ShareLinksSection({ merchantId }: { merchantId: string }) {
  const [links, setLinks] = useState<ShareLinkResponse[]>([]);
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolved, setResolved] = useState<ShareLinkResolveResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [titleInput, setTitleInput] = useState<string>("");
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);

  useEffect(() => {
    async function loadStores() {
      setLoadingStores(true);
      try {
        const data = await mreq<StoreResponse[]>("GET", `/stores/merchant/${merchantId}`);
        setStores(data ?? []);
        if (data && data.length > 0) setSelectedStoreId(data[0].id);
      } catch (e) {
        console.error("Failed to load stores:", e);
      } finally {
        setLoadingStores(false);
      }
    }
    async function loadProducts() {
      setLoadingProducts(true);
      try {
        const data = await mreq<ApiProduct[]>(
          "GET",
          `/merchants/${merchantId}/products?status=active`,
        );
        setProducts(data ?? []);
        // Nothing selected by default — an empty selection means a store link.
        setSelectedProductIds([]);
      } catch (e) {
        console.error("Failed to load products:", e);
      } finally {
        setLoadingProducts(false);
      }
    }
    loadStores();
    loadProducts();
  }, [merchantId]);

  const handleCreate = async () => {
    setError(null);
    if (!selectedStoreId) {
      setError("Please select a store first.");
      return;
    }
    try {
      // Empty product_ids => store link (visitors see all active products).
      // Non-empty => product-set link (visitors see only the selected products).
      const payload: { store_id: string; product_ids: string[]; title?: string } = {
        store_id: selectedStoreId,
        product_ids: selectedProductIds,
      };
      if (titleInput.trim()) payload.title = titleInput.trim();
      // mreq's third argument IS the request body — pass the payload directly.
      const data = await mreq<ShareLinkResponse>("POST", "/links/", payload);
      if (data) setLinks((prev) => [data, ...prev]);
      setTitleInput("");
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
      const data = await mreq<ShareLinkResolveResponse>(
        "GET",
        `/links/public/${encodeURIComponent(code)}`,
      );
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

        {/* Store selector */}
        <div className="space-y-2 mb-4">
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
            Store
            <select
                      value={selectedStoreId}
                      onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            >
              <option value="">-- Select a store --</option>
              {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                </option>
              ))}
            </select>
          </label>
          {loadingStores && <p className="text-xs text-[var(--color-muted)]">Loading stores…</p>}
        </div>

        {/* Title input */}
                <div className="space-y-2 mb-4">
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Link title (optional)
            <input
                      type="text"
                      placeholder="e.g. Summer picks"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </label>
        </div>

                {/* Product picker — checkboxes */}
                <div className="space-y-3 mb-4">
                  <p className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Select products to share
                  </p>
                  {loadingProducts && <p className="text-xs text-[var(--color-muted)]">Loading products…</p>}
                  {!loadingProducts && products.length === 0 && (
                    <p className="text-xs text-[var(--color-muted)]">No active products yet. Add a product first.</p>
                  )}
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
                    {products.map((p) => {
                      const checked = selectedProductIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setSelectedProductIds((prev) =>
                                e.target.checked
                                  ? [...prev, p.id]
                                  : prev.filter((id) => id !== p.id),
                              );
                            }}
                            className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                          />
                          <span className="min-w-0 flex-1 truncate">{p.title}</span>
                          <span className="text-xs text-[var(--color-muted)] capitalize">{p.status}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
                    <span>
                      {selectedProductIds.length === 0
                        ? "Store link — all active products"
                        : `${selectedProductIds.length} product${selectedProductIds.length === 1 ? "" : "s"} selected`}
            </span>
                    {selectedProductIds.length > 0 && (
                      <button
                        onClick={() => setSelectedProductIds([])}
                        className="text-[var(--color-primary)] hover:underline"
              >
                        Clear selection
                      </button>
                    )}
          </div>
                </div>

        <button
          onClick={handleCreate}
                  disabled={loadingProducts || loadingStores || !selectedStoreId}
                  className="w-full mt-3 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Generate link
                </button>
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
                                code={resolved.code}
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
                              code={resolved.code}
                title={resolved.title ?? undefined}
                kind="store"
              />
            </>
          )}
          <button
                          onClick={() => window.open(`${window.location.origin}/s/${resolved.code}`, "_blank", "noopener,noreferrer")}
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
                        code={link.code}
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