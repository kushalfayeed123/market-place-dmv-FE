import { ShoppingCart, Star, ArrowLeft, Package, CheckCircle, Truck } from "lucide-react";
import type { Product } from "./ProductCard";

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100);
}

export function ProductDetail({ product, onBack, onAddToCart }: { product: Product & { description?: string }; onBack?: () => void; onAddToCart?: (p: Product) => void }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden shadow-[var(--shadow)]">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="aspect-square bg-gray-50 relative overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={64} className="text-gray-300" />
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col gap-4">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors self-start">
              <ArrowLeft size={13} /> Back to results
            </button>
          )}

          <div>
            <div className="flex items-center gap-2 mb-1">
              {product.category_name && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary)] bg-blue-50 px-2 py-0.5 rounded-full">
                  {product.category_name}
                </span>
              )}
            </div>
            <h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-foreground)] leading-snug">{product.name}</h2>
            <p className="text-sm text-[var(--color-muted)] mt-1">by {product.merchant_name}</p>
          </div>

          {product.rating !== undefined && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={13} className={i <= Math.round(product.rating!) ? "fill-[var(--color-accent)] text-[var(--color-accent)]" : "text-gray-200 fill-gray-200"} />
                ))}
              </div>
              <span className="text-sm font-semibold">{product.rating}</span>
              <span className="text-sm text-[var(--color-muted)]">({product.reviews?.toLocaleString()} reviews)</span>
            </div>
          )}

          <div className="text-3xl font-[var(--font-mono)] font-semibold text-[var(--color-primary)]">
            {fmt(product.price.amount, product.price.currency)}
          </div>

          {product.description && (
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">{product.description}</p>
          )}

          <div className="flex flex-col gap-2 text-sm text-[var(--color-foreground)]">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-[var(--color-success)]" />
              <span>In stock {product.quantity_available !== undefined && `(${product.quantity_available} units)`}</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck size={14} className="text-[var(--color-primary)]" />
              <span>Ships within 1–3 business days</span>
            </div>
          </div>

          <button
            onClick={() => onAddToCart?.(product)}
            className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white rounded-xl px-6 py-3 font-semibold hover:bg-[var(--color-primary-hover)] transition-colors mt-auto"
          >
            <ShoppingCart size={16} /> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
