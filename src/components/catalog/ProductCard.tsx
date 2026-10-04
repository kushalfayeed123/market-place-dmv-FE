import { ShoppingCart, Star, Package } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  merchant_id: string;
  merchant_name: string;
  category_name?: string;
  price: { amount: number; currency: string };
  image_url?: string;
  quantity_available?: number;
  rating?: number;
  reviews?: number;
  status: string;
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100);
}

export function ProductCard({ product, onAddToCart, onView }: { product: Product; onAddToCart?: (p: Product) => void; onView?: (p: Product) => void }) {
  const outOfStock = (product.quantity_available ?? 1) === 0;

  return (
    <div
      className="group bg-white rounded-xl overflow-hidden border border-[var(--color-border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-200 cursor-pointer flex flex-col"
      onClick={() => onView?.(product)}
    >
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-gray-300" />
          </div>
        )}
        {product.category_name && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-white/90 text-[var(--color-muted)] rounded-full border border-[var(--color-border)]">
            {product.category_name}
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-500">Out of stock</span>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-[11px] text-[var(--color-muted)]">{product.merchant_name}</p>
        <h3 className="text-sm font-medium text-[var(--color-foreground)] leading-snug line-clamp-2">{product.name}</h3>

        {product.rating !== undefined && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={11} className="fill-[var(--color-accent)] text-[var(--color-accent)]" />
            <span className="text-[11px] font-medium text-[var(--color-foreground)]">{product.rating}</span>
            <span className="text-[11px] text-[var(--color-muted)]">({product.reviews?.toLocaleString()})</span>
          </div>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="font-semibold text-[var(--color-primary)] font-[var(--font-mono)] text-sm">
            {fmt(product.price.amount, product.price.currency)}
          </span>
          <button
            disabled={outOfStock}
            onClick={(e) => { e.stopPropagation(); onAddToCart?.(product); }}
            className="p-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ShoppingCart size={14} />
          </button>
        </div>

        {product.quantity_available !== undefined && product.quantity_available > 0 && product.quantity_available <= 10 && (
          <p className="text-[10px] text-[var(--color-warning)] font-medium">Only {product.quantity_available} left</p>
        )}
      </div>
    </div>
  );
}
