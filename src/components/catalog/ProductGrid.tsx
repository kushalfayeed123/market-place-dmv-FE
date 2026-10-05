import { ProductCard, type Product } from "./ProductCard";

export interface ProductGridProps {
  products: Product[];
  query?: string;
  onAddToCart?: (p: Product) => void;
  onView?: (p: Product) => void;
}

export function ProductGrid({ products, query, onAddToCart, onView }: ProductGridProps) {
  if (!products.length) {
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
      {/*
        Responsive masonry grid (CSS columns):
        • Column count auto-grows with the viewport, so each row packs in as
          many products as the screen has room for (1 on phones → many on wide
          desks). That fluid fit is what lets every card stay compact.
        • cards size to their own content (title / rating / stock), giving
          dynamic heights and shapes instead of a rigid, uniform matrix.
        • Each card is wrapped in a break-inside-avoid block so it never splits
          between columns; mb-* keeps a consistent gutter inside a column.
      */}
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 md:gap-4">
        {products.map((p) => (
          <div key={p.id} className="mb-3 break-inside-avoid">
            <ProductCard product={p} onAddToCart={onAddToCart} onView={onView} />
          </div>
        ))}
      </div>
    </div>
  );
}
