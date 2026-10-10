import { useMemo, useState } from "react";
import { Package, Sparkles } from "lucide-react";
import { ProductCard, type Product } from "./ProductCard";
import type { CartState, SortKey } from "./directives";

export interface ProductGridProps {
  products: Product[];
  query?: string;
  summary?: string;
  sort?: SortKey;
  category?: string;
  suggestions?: string[];
  highlights?: Record<string, string>;
  cartState?: CartState;
  onAddToCart?: (p: Product) => void;
  onView?: (p: Product) => void;
  /** Send a follow-up prompt to the agent. When omitted, no agent chips render. */
  onSuggest?: (text: string) => void;
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Best match" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
  { key: "rating", label: "Top rated" },
];

const DEFAULT_REFINE = ["Show cheaper options", "Only top rated", "Show something similar"];
const EMPTY_SUGGESTIONS = ["Show me what's popular", "What categories do you have?"];

const GRID =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={GRID} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          <div className="aspect-square animate-pulse bg-slate-100" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
            <div className="h-8 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Chip({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "h-9 shrink-0 rounded-full border px-3.5 text-sm transition-colors " +
        (active
          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
          : "border-[var(--color-border)] bg-white text-[var(--color-foreground)] hover:border-[var(--color-primary)]")
      }
    >
      {children}
    </button>
  );
}

export function ProductGrid({
  products,
  query,
  summary,
  sort: initialSort,
  category: initialCategory,
  suggestions,
  highlights,
  cartState,
  onAddToCart,
  onView,
  onSuggest,
}: ProductGridProps) {
  const [sort, setSort] = useState<SortKey>(initialSort ?? "relevance");
  const [category, setCategory] = useState<string | null>(initialCategory ?? null);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      if (p.category_name) counts.set(p.category_name, (counts.get(p.category_name) ?? 0) + 1);
    }
    return [...counts.entries()];
  }, [products]);

  const visible = useMemo(() => {
    const list = category ? products.filter((p) => p.category_name === category) : [...products];
    if (sort === "price_asc") list.sort((a, b) => a.price.amount - b.price.amount);
    else if (sort === "price_desc") list.sort((a, b) => b.price.amount - a.price.amount);
    else if (sort === "rating") list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return list;
  }, [products, sort, category]);

  if (!products.length) {
    const chips = suggestions?.length ? suggestions : EMPTY_SUGGESTIONS;
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white px-6 py-12 text-center">
        <Package size={36} className="mx-auto mb-3 text-slate-300" />
        <p className="text-base font-medium">
          {query ? `Nothing found for “${query}”` : "No products found"}
        </p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Try fewer words or a broader category{onSuggest ? ", or ask the agent for ideas." : "."}
        </p>
        {onSuggest && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {chips.map((s) => (
              <Chip key={s} onClick={() => onSuggest(s)}>{s}</Chip>
            ))}
          </div>
        )}
      </div>
    );
  }

  const showToolbar = products.length > 1;
  const refine = onSuggest ? (suggestions?.length ? suggestions : query ? DEFAULT_REFINE : []) : [];

  return (
    <section className="space-y-4" aria-label={query ? `Results for ${query}` : "Products"}>
      {summary && (
        <div className="flex gap-3 rounded-2xl bg-[var(--color-agent-soft)] p-4 text-sm leading-relaxed">
          <Sparkles size={18} className="mt-0.5 shrink-0 text-[var(--color-agent)]" />
          <p>{summary}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted)]" aria-live="polite">
          <span className="font-semibold text-[var(--color-foreground)]">{visible.length}</span>{" "}
          {visible.length === 1 ? "product" : "products"}
          {query && <> for <span className="font-semibold text-[var(--color-foreground)]">“{query}”</span></>}
        </p>
        {showToolbar && (
          <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 rounded-lg border border-[var(--color-border)] bg-white px-2 text-sm text-[var(--color-foreground)]"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {categories.length > 1 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <Chip active={category === null} onClick={() => setCategory(null)}>All</Chip>
          {categories.map(([name, n]) => (
            <Chip key={name} active={category === name} onClick={() => setCategory(category === name ? null : name)}>
              {name} ({n})
            </Chip>
          ))}
        </div>
      )}

      <div className={GRID}>
        {visible.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            badge={highlights?.[p.id]}
            cartState={cartState?.[p.id]}
            onAddToCart={onAddToCart}
            onView={onView}
          />
        ))}
      </div>

      {refine.length > 0 && onSuggest && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
            <Sparkles size={14} className="text-[var(--color-agent)]" /> Refine with the agent
          </span>
          {refine.map((s) => (
            <Chip key={s} onClick={() => onSuggest(s)}>{s}</Chip>
          ))}
        </div>
      )}
    </section>
  );
}
