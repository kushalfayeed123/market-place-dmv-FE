/**
 * Pure payment-capture state machine.
 *
 * Extracted from `PaymentCapturePanel.tsx` so the decision logic can be
 * unit-tested without a DOM/JSX transform. The component imports the same
 * function and types, keeping a single source of truth for what the panel
 * renders in each state.
 */

export type PaymentStatus =
  | "pending"
  | "initialized"
  | "success"
  | "failed"
  | "paid"
  | "unknown"
  | "pending_verification";

/** The payment object the gateway forwards after `process_payment`. */
export type PaymentInfo = {
  id?: string;
  status?: string;
  amount?: { amount: number; currency: string };
  provider?: string;
  payment_method?: string;
  provider_reference?: string;
  payment_url?: string;
  created_at?: string;
  updated_at?: string;
};

export type PaymentCaptureState = {
  isPaid: boolean;
  isFailed: boolean;
  /** "pending" + a payment object exists -> buyer was redirected, awaiting webhook. */
  awaitingConfirmation: boolean;
  /** pay_on_delivery: order placed, awaiting merchant to confirm payment after delivery. */
  awaitingMerchant: boolean;
  /** A redirect URL is available -> render the "Complete Payment" button. */
  showComplete: boolean;
  /** No payment yet and checkout is unpaid -> render the "Pay Now" button. */
  showPayNow: boolean;
  header: string;
};

/**
 * Resolve what the `PaymentCapturePanel` should render given the directive
 * props it receives from the gateway.
 *
 * `status` is the *order* status emitted straight from the backend (e.g.
 * "pending" right after checkout). A `payment` object only exists once
 * `process_payment` has already been called, so:
 *   - "pending" + no `payment`  -> checkout just finished, buyer must tap Pay Now
 *   - "pending" + `payment`      -> buyer was redirected, awaiting the webhook
 *   - "initialized" + payment_url -> show "Complete Payment"
 */
export function resolvePaymentState(
  status: string,
  payment?: PaymentInfo,
  payment_required?: boolean,
): PaymentCaptureState {
  const payStatus = (payment?.status ?? status) as PaymentStatus;
  const isPaid = payStatus === "success" || payStatus === "paid";
  const isPending = payStatus === "pending";
  const pendingVerification = payStatus === "pending_verification";
  // A payment object only exists once process_payment has run, so it is the
  // reliable signal that we're genuinely awaiting a webhook (state b).
  const awaitingConfirmation = isPending && !!payment;
  const awaitingMerchant =
    payment?.provider === "pay_on_delivery" ||
    payment?.payment_method === "pay_on_delivery" ||
    pendingVerification;
  const hasRedirectUrl = Boolean(payment?.payment_url);
  return {
    isPaid,
    isFailed: payStatus === "failed",
    awaitingConfirmation,
    awaitingMerchant,
    showComplete: !awaitingConfirmation && hasRedirectUrl,
    showPayNow:
      !isPaid &&
      !awaitingConfirmation &&
      !awaitingMerchant &&
      !hasRedirectUrl &&
      payment_required !== false,
    header: awaitingConfirmation
      ? "Processing Payment"
      : awaitingMerchant
        ? "Pay on Delivery — Awaiting Merchant Confirmation"
        : "Complete Your Payment",
  };
}
