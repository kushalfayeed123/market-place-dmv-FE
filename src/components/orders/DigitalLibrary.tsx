"use client";

import { useEffect, useState } from "react";
import { AlertCircle, BookOpen, LoaderCircle, X } from "lucide-react";
import { ApiError, apiClient, type Product } from "@/lib/api/client";

interface LibraryItem {
  product: Product;
}

const eligibleOrderStatuses = new Set([
  "accepted",
  "paid",
  "partially_fulfilled",
  "shipped",
  "fulfilled",
]);

export function DigitalLibrary({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadLibrary() {
      try {
        const orders = await apiClient.getOrders();
        const productIds = [
          ...new Set(
            orders
              .filter((order) => eligibleOrderStatuses.has(order.status.toLowerCase()))
              .flatMap((order) =>
                order.items
                  .map((item) => item.product_id)
                  .filter((id): id is string => typeof id === "string" && id.length > 0),
              ),
          ),
        ];
        const products = await Promise.all(productIds.map((id) => apiClient.getProduct(id)));
        if (!cancelled) {
          setItems(
            products
              .filter((product) => product.fulfillment_type === "digital" && product.digital_file_url)
              .map((product) => ({ product })),
          );
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError || e instanceof Error ? e.message : "Could not load your library.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadLibrary();
    return () => {
      cancelled = true;
    };
  }, []);

  async function requestAccess(productId: string) {
    setActiveProductId(productId);
    setError(null);
    const readingWindow = window.open("about:blank", "_blank");
    if (!readingWindow) {
      setError("Allow pop-ups to open your digital product, then try again.");
      setActiveProductId(null);
      return;
    }
    try {
      const { download_url } = await apiClient.getPurchasedProductFile(productId);
      readingWindow.location.replace(download_url);
    } catch (e) {
      readingWindow.close();
      setError(e instanceof ApiError || e instanceof Error ? e.message : "Could not open this digital product.");
    } finally {
      setActiveProductId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="digital-library-title"
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <BookOpen size={19} className="text-[var(--color-primary)]" />
            <h2 id="digital-library-title" className="font-semibold text-[var(--color-foreground)]">
              My digital library
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close digital library"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {loading ? (
            <p className="flex items-center gap-2 py-8 text-sm text-[var(--color-muted)]">
              <LoaderCircle size={16} className="animate-spin" /> Loading purchased books…
            </p>
          ) : error && items.length === 0 ? (
            <p role="alert" className="flex items-center gap-2 py-8 text-sm text-[var(--color-danger-fg)]">
              <AlertCircle size={16} /> {error}
            </p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-muted)]">
              Digital products from paid orders will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {items.map(({ product }) => (
                <li key={product.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--color-foreground)]">{product.title}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">Purchased digital product</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void requestAccess(product.id)}
                    disabled={activeProductId !== null}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-foreground)] hover:bg-slate-50 disabled:opacity-50"
                  >
                    {activeProductId === product.id && <LoaderCircle size={13} className="animate-spin" />}
                    {activeProductId === product.id ? "Opening…" : "Read now"}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && items.length > 0 && (
            <p role="alert" className="mt-4 text-sm text-[var(--color-danger-fg)]">{error}</p>
          )}
        </div>
      </section>
    </div>
  );
}
