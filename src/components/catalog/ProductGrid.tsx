import { ProductCard, type Product } from "./ProductCard";

export interface ProductGridProps {
  products: Product[];
  query?: string;
  onAddToCart?: (p: Product) => void;
  onView?: (p: Product) => void;
}

export function ProductGrid({ products, query, onAddToCart, onView }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-10 text-center text-[var(--color-muted)]">
        <p className="text-sm">No products found{query ? ` for "${query}"` : ""}.</p>
      </div>
    );
  }

  return (
    <div>
      {query && (
        <p className="text-xs text-[var(--color-muted)] mb-3">
          {products.length} result{products.length !== 1 ? "s" : ""} for <span className="font-semibold text-[var(--color-foreground)]">"{query}"</span>
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onView={onView} />
        ))}
      </div>
    </div>
  );
}
