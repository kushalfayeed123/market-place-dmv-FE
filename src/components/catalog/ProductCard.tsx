import { useState } from "react";
import { ShoppingCart, Star, Package, Check, Loader2, Sparkles } from "lucide-react";
import { formatMoney, cleanLabel } from "./format";

export interface Product {
  id: string;
  name: string;
  merchant_id: string;
  merchant_name: string;
  category_name?: string;
  price: { amount: number; currency: string };
  image_url?: string;
  urls?: string[]; // product image URLs (primary first, then the gallery)
  quantity_available?: number;
  rating?: number;
  reviews?: number;
  status: string;
}

/** Ordered image list: prefer `urls`, fall back to legacy `image_url`. */
export function productImages(p: Product): string[] {
  if (p.urls && p.urls.length) return p.urls;
  return p.image_url ? [p.image_url] : [];
}

export function ProductCard({
  product,
  badge,
  cartState,
  onAddToCart,
  onView,
}: {
  product: Product;
  /** Agent highlight, e.g. "Best match". */
  badge?: string;
  cartState?: "adding" | "added";
  onAddToCart?: (p: Product) => void;
  onView?: (p: Product) => void;
}) {
  const [broken, setBroken] = useState(false);
  const images = productImages(product);
  const outOfStock = product.quantity_available === 0;
  const lowStock =
    product.quantity_available !== undefined &&
    product.quantity_available > 0 &&
    product.quantity_available <= 10;
  const meta = [cleanLabel(product.merchant_name), product.category_name]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
      <button
        type="button"
        onClick={() => onView?.(product)}
        aria-label={`View ${product.name}`}
        className="relative block aspect-square w-full overflow-hidden bg-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]"
      >
        {images[0] && !broken ? (
          <>
            <img
              src={images[0]}
              alt=""
              loading="lazy"
              onError={() => setBroken(true)}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {images[1] && (
              <img
                src={images[1]}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <Package size={40} className="text-slate-300" />
          </span>
        )}
        {badge && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-agent)] px-2 py-1 text-xs font-medium text-white shadow-sm">
            <Sparkles size={12} /> {badge}
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/75 text-sm font-semibold text-slate-600">
            Sold out
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {meta && (
          <p className="truncate text-xs text-[var(--color-muted)]" title={meta}>
            {meta}
          </p>
        )}
        <h3 className="text-sm font-medium leading-snug text-[var(--color-foreground)]">
          <button
            type="button"
            onClick={() => onView?.(product)}
            title={product.name}
            className="line-clamp-2 text-left hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {product.name}
          </button>
        </h3>

        {product.rating !== undefined && (
          <p className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
            <Star size={12} className="fill-[var(--color-accent)] text-[var(--color-accent)]" />
            <span className="font-medium text-[var(--color-foreground)]">{product.rating}</span>
            {product.reviews !== undefined && <span>({product.reviews.toLocaleString()})</span>}
          </p>
        )}

        {lowStock && (
          <p className="text-xs font-medium text-[var(--color-warning-fg)]">
            Only {product.quantity_available} left
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="font-[var(--font-mono)] text-base font-semibold text-[var(--color-foreground)]">
            {formatMoney(product.price.amount, product.price.currency)}
          </span>
          <button
            type="button"
            disabled={outOfStock || cartState === "adding"}
            onClick={() => onAddToCart?.(product)}
            aria-live="polite"
            className={
              "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 " +
              (cartState === "added"
                ? "bg-[var(--color-success-fg)]"
                : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]")
            }
          >
            {cartState === "adding" ? (
              <><Loader2 size={14} className="animate-spin" /> Adding</>
            ) : cartState === "added" ? (
              <><Check size={14} /> Added</>
            ) : (
              <><ShoppingCart size={14} /> Add</>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
