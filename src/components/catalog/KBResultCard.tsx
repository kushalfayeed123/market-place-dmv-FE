import { FileText, ArrowRight } from "lucide-react";

/**
 * A knowledge-base snippet returned by `semantic_search`.
 *
 * NOTE: these are raw KB documents (text + metadata), NOT product DTOs.
 * They come back without `name`/`price`, so they render as snippet cards.
 * A product is opened via `metadata.product_id` (App resolves it locally
 * from the loaded catalog when possible, else asks the agent).
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

const MAX_SNIPPET = 220;

export function KBResultCard({
  doc,
  onViewProduct,
}: {
  doc: KBSearchResult;
  onViewProduct?: (product_id: string) => void;
}) {
  const title =
    doc.title || (doc.metadata ? String(doc.metadata.source || "") : "") || "Knowledge result";
  const snippet = doc.text || "";
  const body = snippet.length > MAX_SNIPPET ? `${snippet.slice(0, MAX_SNIPPET)}…` : snippet;
  const productId = doc.metadata ? doc.metadata.product_id : undefined;
  const score = typeof doc.score === "number" ? doc.score : undefined;

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-start gap-3">
        <FileText size={18} className="mt-0.5 shrink-0 text-[var(--color-agent)]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          {body && (
            <p className="mt-1 break-words text-sm leading-relaxed text-[var(--color-muted)]" title={snippet}>
              {body}
            </p>
          )}
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2">
        {productId ? (
          <button
            type="button"
            onClick={() => onViewProduct?.(productId)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
          >
            View product <ArrowRight size={14} />
          </button>
        ) : (
          <span className="text-xs text-[var(--color-muted)]">Reference only</span>
        )}
        {score !== undefined && (
          <span className="rounded-full bg-[var(--color-agent-soft)] px-2 py-1 text-xs text-[var(--color-agent)]">
            {Math.round(score * 1000) / 10}% match
          </span>
        )}
      </div>
    </div>
  );
}

export function KBResultList({
  docs,
  onViewProduct,
}: {
  docs: KBSearchResult[];
  onViewProduct?: (product_id: string) => void;
}) {
  return (
    <section className="space-y-3" aria-label="From the knowledge base">
      <h3 className="text-sm font-semibold text-[var(--color-muted)]">From the knowledge base</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((doc, i) => (
          <KBResultCard key={doc.id ?? `${i}-${doc.text?.slice(0, 24)}`} doc={doc} onViewProduct={onViewProduct} />
        ))}
      </div>
    </section>
  );
}
