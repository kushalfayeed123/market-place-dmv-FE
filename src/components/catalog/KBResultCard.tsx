import { FileText } from "lucide-react";

/**
 * A knowledge-base snippet returned by `semantic_search`.
 *
 * NOTE: these are raw KB documents (text + metadata) — NOT product DTOs.
 * They intentionally come back without `name`/`price`, so they must be
 * rendered as snippet cards (not `ProductCard`) and a product is opened by
 * routing the `metadata.product_id` back through the agent
 * (`Show me details for product <id>` -> `get_product_detail`).
 */
export interface KBSearchResult {
  id?: string;
  title?: string;
  text?: string;
  score?: number;
  kind?: string;
  topic?: string;
  metadata?: {
    product_id?: string;
    source?: string;
    [key: string]: unknown;
  };
}

const MAX_SNIPPET = 170;

/** Render a single semantic-search hit as a clickable snippet card. */
export function KBResultCard({
  doc,
  onViewProduct,
}: {
  doc: KBSearchResult;
  onViewProduct?: (product_id: string) => void;
}) {
  const title =
    doc.title ||
    (doc.metadata ? String(doc.metadata.source || "") : "") ||
    "Knowledge result";
  const snippet = doc.text || "";
  const body =
    snippet.length > MAX_SNIPPET
      ? `${snippet.slice(0, MAX_SNIPPET)}…`
      : snippet;
  const productId = doc.metadata ? doc.metadata.product_id : undefined;
  const score = typeof doc.score === "number" ? doc.score : undefined;

  return (
    <div
      className={
        "flex flex-col gap-2.5 p-3 bg-white rounded-xl border border-[var(--color-border)] " +
        "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
      }
    >
      <div className="flex items-start gap-2.5">
        <FileText
          size={16}
          className="text-[var(--color-muted)] shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            {title}
          </p>
          {body && (
            <p
              className="mt-1 text-[12px] text-[var(--color-foreground)] line-clamp-3 break-words"
              title={snippet}
            >
              {body}
            </p>
          )}
          {score !== undefined && (
            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.25 rounded bg-[var(--color-agent)]/10 text-[var(--color-agent)]">
              {Math.round(score * 1000) / 10}% match
            </span>
          )}
        </div>
      </div>
      {productId ? (
        <button
          type="button"
          onClick={() => onViewProduct?.(productId)}
          className="self-start text-[11px] font-medium text-[var(--color-primary)] hover:underline"
        >
          View product
        </button>
      ) : (
        <span className="text-[10px] text-[var(--color-muted)]">
          KB reference
        </span>
      )}
    </div>
  );
}
