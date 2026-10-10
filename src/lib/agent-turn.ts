import type { UiDirective } from "@/types/components";

type Props = Record<string, unknown>;

/** Product-shaped items in a ProductGrid directive (KB documents have no `name`). */
function productIdsOf(d: UiDirective): string[] {
  const p = d.props as Props;
  const raw = Array.isArray(p.items) ? p.items : Array.isArray(p.products) ? p.products : [];
  return (raw as Props[])
    .filter((i) => i && typeof i.name === "string")
    .map((i) => String(i.id));
}

function itemCount(d: UiDirective): number {
  const p = d.props as Props;
  const raw = Array.isArray(p.items) ? p.items : Array.isArray(p.products) ? p.products : [];
  return raw.length;
}

const KEEP_LAST = ["CartSummary", "OrderList", "MerchantBalanceCard", "LedgerTable"];

/**
 * Clean up the directives collected during ONE agent turn before they are shown.
 *  - an empty ProductGrid is dropped (the agent's text already says "no results");
 *  - a ProductDetail supersedes any grid / card that only contains that same product
 *    (this is the "small card with a bigger card right under it" duplicate);
 *  - identical directives collapse to one; singleton views keep the latest;
 *  - if everything was dropped and the agent said nothing, one empty grid is kept
 *    so the shopper still gets an empty state with suggestions.
 */
const PRODUCT_VIEWS = new Set(["ProductGrid", "ProductCard", "ProductDetail"]);

export function dedupeDirectives(
  input: UiDirective[],
  hasText: boolean,
  opts: { cartIntent?: boolean } = {},
): UiDirective[] {
  // Adding to / editing the cart: show ONLY the cart. Product views appear when the shopper asks for them.
  const cartOnly = !!opts.cartIntent && input.some((d) => d.component === "CartSummary");
  const detailIds = new Set(
    input.filter((d) => d.component === "ProductDetail").map((d) => String((d.props as Props).id)),
  );
  const seen = new Set<string>();
  let out: UiDirective[] = [];

  for (const d of input) {
    if (cartOnly && PRODUCT_VIEWS.has(d.component)) continue;
    if (d.component === "ProductGrid") {
      if (itemCount(d) === 0) continue;
      const ids = productIdsOf(d);
      if (ids.length > 0 && ids.every((id) => detailIds.has(id))) continue;
    }
    if (d.component === "ProductCard") {
      const id = String(((d.props as Props).product as Props | undefined)?.id);
      if (detailIds.has(id)) continue;
    }
    const key = d.component + ":" + JSON.stringify(d.props);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(d);
  }

  // Same product detail twice: keep the last one.
  const lastDetail = new Map<string, number>();
  out.forEach((d, i) => d.component === "ProductDetail" && lastDetail.set(String((d.props as Props).id), i));
  out = out.filter((d, i) => d.component !== "ProductDetail" || lastDetail.get(String((d.props as Props).id)) === i);

  for (const c of KEEP_LAST) {
    const last = out.map((d) => d.component).lastIndexOf(c);
    out = out.filter((d, i) => d.component !== c || i === last);
  }

  if (!out.length && !hasText) {
    const empty = input.find((d) => d.component === "ProductGrid");
    if (empty) out.push(empty);
  }
  return out;
}

/**
 * The model sometimes emits markdown. The UI shows plain prose, and the SAME
 * function is used for the live bubble and the committed message, so nothing
 * changes shape when streaming ends.
 */
export function cleanAgentText(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*\*$/, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "• ");
}
