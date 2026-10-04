import { ShoppingCart, Star, Package } from "lucide-react";
import { useState } from "react";

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

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

// Ordered image list: prefer the new `urls` array, fall back to legacy `image_url`.
function productImages(p: Product): string[] {
  if (p.urls && p.urls.length) return p.urls;
  return p.image_url ? [p.image_url] : [];
}

export function ProductCard({
  product,
  onAddToCart,
  onView,
}: {
  product: Product;
  onAddToCart?: (p: Product) => void;
  onView?: (p: Product) => void;
}) {
  const outOfStock = (product.quantity_available ?? 1) === 0;
  const images = productImages(product);
  const [active, setActive] = useState(0);

  return (
    <div
      className="group bg-white rounded-xl overflow-hidden border border-[var(--color-border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col"
      onClick={() => onView?.(product)}
    >
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {images[active] ? (
          <img
            src={images[active]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={40} className="text-gray-300" />
          </div>
        )}
        {product.category_name && (
          <span
            className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-white/90 text-[var(--color-muted)] rounded-full border border-[var(--color-border)]"
            title={product.category_name}
          >
            {product.category_name}
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-500">Out of stock</span>
          </div>
        )}
        {/* Dot pager — only for multi-image products, clickable to switch the main shot. */}
        {images.length > 1 && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-0.75">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`View image ${i + 1} of ${images.length}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(i);
                }}
                className={
                  i === active
                    ? "w-4 h-4 rounded-full bg-white shadow ring-1 ring-white"
                    : "w-4 h-4 rounded-full bg-white/60 hover:bg-white transition-colors"
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-2.5 flex flex-col gap-0.5 flex-1">
        <p className="text-[10px] text-[var(--color-muted)] truncate" title={product.merchant_name}>
          {product.merchant_name}
        </p>
        <h3
          className="text-[12px] font-medium text-[var(--color-foreground)] leading-snug line-clamp-2"
          title={product.name}
        >
          {product.name}
        </h3>

        {product.rating !== undefined && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={10} className="fill-[var(--color-accent)] text-[var(--color-accent)]" />
            <span className="text-[10px] font-medium text-[var(--color-foreground)]">{product.rating}</span>
            <span className="text-[10px] text-[var(--color-muted)]">({product.reviews?.toLocaleString()})</span>
          </div>
        )}

        <div className="mt-auto pt-1.5 flex items-center justify-between">
          <span className="font-semibold text-[var(--color-primary)] font-[var(--font-mono)] text-[13px]">
            {fmt(product.price.amount, product.price.currency)}
          </span>
          <button
            type="button"
            disabled={outOfStock}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(product);
            }}
            className="p-1 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ShoppingCart size={12} />
          </button>
        </div>

        {product.quantity_available !== undefined &&
          product.quantity_available > 0 &&
          product.quantity_available <= 10 && (
            <p className="text-[9px] text-[var(--color-warning)] font-medium">
              Only {product.quantity_available} left
            </p>
          )}
      </div>
    </div>
  );
}
