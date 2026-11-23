import type { OrderDetailItemView, OrderDetailViewProps } from "./OrderDetailView";

export type Money = { amount: number; currency: string };

/** Accept either a PriceView ({amount, currency}) or flat (amount, currency) fields. */
function asMoney(value: unknown, flatAmount?: unknown, flatCurrency?: unknown): Money {
  if (value && typeof value === "object" && "amount" in (value as object)) {
    const m = value as Money;
    return { amount: Number(m.amount) || 0, currency: m.currency || "NGN" };
  }
  return { amount: Number(flatAmount) || 0, currency: String(flatCurrency || "NGN") };
}

/** Normalize one item — the agent DTO uses PriceView objects, the raw backend uses flat ints. */
function normalizeItem(item: Partial<OrderDetailItemView> & Record<string, unknown>): OrderDetailItemView {
  return {
    variant_id: typeof item.variant_id === "string" ? item.variant_id : undefined,
    product_id: typeof item.product_id === "string" ? item.product_id : undefined,
    product_name: String(item.product_name ?? "Item"),
    variant_name: typeof item.variant_name === "string" ? item.variant_name : undefined,
    sku: typeof item.sku === "string" ? item.sku : undefined,
    quantity: Number(item.quantity) || 1,
    unit_price: asMoney(item.unit_price, item.unit_price, item.currency),
    line_total: asMoney(item.line_total, item.line_total, item.currency),
  };
}

export interface NormalizedOrderDetail {
  order_number: string;
  status: string;
  total: Money;
  subtotal: Money;
  items: OrderDetailItemView[];
}

/**
 * Normalize an OrderDetail directive's props — tolerates both the agent's
 * view DTO (PriceView objects) and the raw backend shape (total_amount,
 * flat int prices) so a missing `total` can never crash the view.
 *
 * The subtotal is derived from the line items when the directive doesn't
 * carry a real one, so it never shows ₦0 for an order that has items.
 */
export function normalizeOrderDetail(props: OrderDetailViewProps): NormalizedOrderDetail {
  const items = (props.items ?? []).map(normalizeItem);
  const declaredSubtotal = props.subtotal ? asMoney(props.subtotal) : undefined;
  const itemsSum = items.reduce((sum, i) => sum + i.line_total.amount, 0);
  const currency = declaredSubtotal?.currency ?? props.currency ?? items[0]?.line_total.currency ?? "NGN";
  const subtotal: Money =
    declaredSubtotal && declaredSubtotal.amount > 0
      ? declaredSubtotal
      : { amount: itemsSum, currency };
  return {
    order_number: props.order_number ?? "—",
    status: props.status ?? "pending",
    total: asMoney(props.total, props.total_amount, props.currency),
    subtotal,
    items,
  };
}
