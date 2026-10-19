// Pure helpers that decide which order actions a merchant can take.
// Kept framework-free so they can be unit-tested without rendering React.

export type OrderActionKey =
  | "confirm_payment"
  | "accept"
  | "ship"
  | "cancel"
  | "cancel_refund";

export interface OrderAction {
  key: OrderActionKey;
  label: string;
  /** API path (relative to /api/v1) for the action, given the order id. */
  apiPath: (orderId: string) => string;
  /** If set, the UI shows a confirmation step before invoking the action. */
  confirm?: string;
  tone?: "danger";
}

/**
 * Actions available for a merchant on an order in the given status.
 * Mirrors the rules used by the orders list (`components/merchant/sections.ts`):
 *   - pending / awaiting_approval → Confirm payment (approve)
 *   - paid                       → Accept order
 *   - partially_fulfilled        → Mark shipped
 *   - pending                    → Cancel order (no refund, unpaid)
 *   - paid / partially_fulfilled → Cancel & refund
 */
export function getOrderActions(status: string): OrderAction[] {
  const actions: OrderAction[] = [];

  if (status === "pending" || status === "awaiting_approval") {
    actions.push({
      key: "confirm_payment",
      label: "Confirm payment",
      apiPath: (id) => `/orders/${id}/approve`,
      confirm:
        "Confirm you have received payment for this order? This releases the payout to the merchant.",
    });
  }

  if (status === "paid") {
    actions.push({
      key: "accept",
      label: "Accept order",
      apiPath: (id) => `/orders/${id}/accept`,
    });
  }

  if (status === "partially_fulfilled") {
    actions.push({
      key: "ship",
      label: "Mark shipped",
      apiPath: (id) => `/orders/${id}/ship`,
    });
  }

  if (status === "pending") {
    actions.push({
      key: "cancel",
      label: "Cancel order",
      apiPath: (id) => `/orders/${id}/cancel`,
      confirm: "Cancel this unpaid order?",
      tone: "danger",
    });
  }

  if (status === "paid" || status === "partially_fulfilled") {
    actions.push({
      key: "cancel_refund",
      label: "Cancel & refund",
      apiPath: (id) => `/orders/${id}/cancel`,
      confirm: "Cancel this order and refund the buyer?",
      tone: "danger",
    });
  }

  return actions;
}
