import type { Product } from "./api/client";

export type CheckoutFulfillment = "delivery" | "digital" | "service";

export function resolveCheckoutFulfillment(
  products: Pick<Product, "fulfillment_type" | "product_types">[],
): CheckoutFulfillment {
  const types = products.flatMap((product) => product.product_types ?? []);
  if (products.some((product) => product.fulfillment_type === "physical") || types.includes("physical")) {
    return "delivery";
  }
  if (products.some((product) => product.fulfillment_type === "digital") || types.includes("digital")) {
    return "digital";
  }
  return "service";
}

/** Order statuses where the checkout flow is finished — the payment modal must never return for these. */
export const COMPLETED_ORDER_STATUSES = ["accepted", "fulfilled", "delivered", "cancelled", "refunded"];

/**
 * Extract the order UUID from a provider transaction reference.
 *
 * The backend generates references as ``ord_<order_uuid>_<hex12>`` (stub mode
 * prefixes with ``paystack_``).  Paystack echoes the reference back on the
 * callback URL as ``?trxref=...&reference=...``, so the app can reload the
 * checkout state from the URL alone after the provider redirect.
 */
export function orderIdFromProviderReference(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const m = /ord_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_/i.exec(ref);
  return m ? m[1] : null;
}

/**
 * True when the order is confirmed and its payment is confirmed (or the order
 * reached a terminal state). Completed checkouts are never persisted/restored,
 * so the payment modal does not reappear after a reload.
 */
export function isCheckoutComplete(
  pending: { payment?: { status?: string } | null } | null,
  orderStatus: string | null,
): boolean {
  return (
    !!pending &&
    (pending.payment?.status === "success" || COMPLETED_ORDER_STATUSES.includes(orderStatus ?? ""))
  );
}
