import { useState } from "react";
import {
  ShoppingCart, Star, ArrowLeft, Package, CheckCircle, AlertCircle, Truck,
  Minus, Plus, Sparkles, Loader2, Check,
} from "lucide-react";
import { ProductCard, productImages, type Product } from "./ProductCard";
import { formatMoney, cleanLabel } from "./format";
import type { ProductDetailExtras } from "./directives";

export function ProductDetail({
  product,
  related,
  cartState,
  onBack,
  onAddToCart,
  onView,
  onSuggest,
}: {
  product: Product & ProductDetailExtras;
  related?: Product[];
  cartState?: "adding" | "added";
  onBack?: () => void;
  onAddToCart?: (p: Product, quantity: number) => void;
  onView?: (p: Product) => void;
  onSuggest?: (text: string) => void;
}) {
  const images = productImages(product);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [expanded, setExpanded] = useState(false);

  const stock = product.quantity_available;
  const outOfStock = stock === 0;
  const maxQty = stock !== undefined ? Math.max(stock, 1) : 99;
  const merchant = cleanLabel(product.merchant_name);
  const total = product.price.amount * qty;
  const longDesc = (product.description?.length ?? 0) > 280;
  const quickAsks =
    product.suggestions?.length
      ? product.suggestions
      : [
          `Compare ${product.name} with similar products`,
          `Show similar products cheaper than ${formatMoney(product.price.amount, product.price.currency)}`,
        ];

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow)]">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-4 md:p-6">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
              {images[active] ? (
                <img src={images[active]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package size={64} className="text-slate-300" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`Show image ${i + 1} of ${images.length}`}
                    aria-current={i === active}
                    className={
                      "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 " +
                      (i === active ? "border-[var(--color-primary)]" : "border-transparent opacity-70 hover:opacity-100")
                    }
                  >
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 p-5 md:p-6">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-9 items-center gap-1.5 self-start rounded-lg px-2 text-sm text-[var(--color-muted)] hover:bg-slate-100 hover:text-[var(--color-foreground)]"
              >
                <ArrowLeft size={15} /> Back to results
              </button>
            )}

            <div>
              {product.category_name && (
                <span className="mb-2 inline-block rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-primary)]">
                  {product.category_name}
                </span>
              )}
              <h2 className="text-2xl font-semibold leading-snug">{product.name}</h2>
              {merchant && <p className="mt-1 text-sm text-[var(--color-muted)]">Sold by {merchant}</p>}
            </div>

            {product.rating !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex gap-0.5" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={15}
                      className={i <= Math.round(product.rating!) ? "fill-[var(--color-accent)] text-[var(--color-accent)]" : "fill-slate-200 text-slate-200"}
                    />
                  ))}
                </div>
                <span className="font-semibold">{product.rating}</span>
                {product.reviews !== undefined && (
                  <span className="text-[var(--color-muted)]">({product.reviews.toLocaleString()} reviews)</span>
                )}
              </div>
            )}

            <div className="font-[var(--font-mono)] text-3xl font-semibold">
              {formatMoney(product.price.amount, product.price.currency)}
            </div>

            {product.agent_note && (
              <div className="flex gap-3 rounded-xl bg-[var(--color-agent-soft)] p-3.5 text-sm leading-relaxed">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-[var(--color-agent)]" />
                <p>{product.agent_note}</p>
              </div>
            )}

            {product.description && (
              <div>
                <p className={"text-sm leading-relaxed text-[var(--color-muted)] " + (longDesc && !expanded ? "line-clamp-4" : "")}>
                  {product.description}
                </p>
                {longDesc && (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-1 text-sm font-medium text-[var(--color-primary)] hover:underline"
                  >
                    {expanded ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            )}

            {product.specs && product.specs.length > 0 && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                {product.specs.map((s) => (
                  <div key={s.label} className="contents">
                    <dt className="text-[var(--color-muted)]">{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="flex flex-col gap-2 text-sm">
              {stock !== undefined && (
                <div className="flex items-center gap-2">
                  {outOfStock ? (
                    <><AlertCircle size={15} className="text-[var(--color-danger)]" /><span>Sold out</span></>
                  ) : (
                    <>
                      <CheckCircle size={15} className="text-[var(--color-success)]" />
                      <span>{stock <= 10 ? `Only ${stock} left` : "In stock"}</span>
                    </>
                  )}
                </div>
              )}
              {product.shipping_note && (
                <div className="flex items-center gap-2">
                  <Truck size={15} className="text-[var(--color-primary)]" />
                  <span>{product.shipping_note}</span>
                </div>
              )}
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex h-12 items-center rounded-xl border border-[var(--color-border)]" role="group" aria-label="Quantity">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1 || outOfStock}
                  aria-label="Decrease quantity"
                  className="flex h-12 w-11 items-center justify-center disabled:opacity-40"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty || outOfStock}
                  aria-label="Increase quantity"
                  className="flex h-12 w-11 items-center justify-center disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                type="button"
                disabled={outOfStock || cartState === "adding"}
                onClick={() => onAddToCart?.(product, qty)}
                className={
                  "inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl px-6 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 " +
                  (cartState === "added" ? "bg-[var(--color-success-fg)]" : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]")
                }
              >
                {outOfStock ? (
                  "Sold out"
                ) : cartState === "adding" ? (
                  <><Loader2 size={16} className="animate-spin" /> Adding to cart</>
                ) : cartState === "added" ? (
                  <><Check size={16} /> Added to cart</>
                ) : (
                  <><ShoppingCart size={16} /> Add to cart · {formatMoney(total, product.price.currency)}</>
                )}
              </button>
            </div>

            {onSuggest && (
              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-4">
                <span className="flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
                  <Sparkles size={14} className="text-[var(--color-agent)]" /> Ask the agent
                </span>
                {quickAsks.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSuggest(s)}
                    className="h-9 rounded-full border border-[var(--color-border)] bg-white px-3.5 text-sm hover:border-[var(--color-primary)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {related && related.length > 0 && (
        <section aria-label="Related products" className="space-y-3">
          <h3 className="text-base font-semibold">You might also like</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} onView={onView} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
