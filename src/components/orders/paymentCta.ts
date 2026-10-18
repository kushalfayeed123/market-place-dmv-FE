/**
 * Pure CTA-resolution logic for `PaymentSelection.tsx`.
 *
 * Extracted so the decision — which call-to-action (if any) to render for the
 * currently selected payment method — can be unit-tested without a DOM/JSX
 * transform. The component imports the same function, keeping a single source
 * of truth.
 */

export type PaymentCtaKind = "paystack" | "pay_on_delivery";

export type PaymentCta =
  | { kind: PaymentCtaKind; label: string }
  | null;

const CTA_LABELS: Record<PaymentCtaKind, string> = {
  paystack: "Proceed to Paystack",
  pay_on_delivery: "Confirm Pay on Delivery",
};

/**
 * Resolve the footer CTA for the current selection.
 *
 * A CTA only exists when (a) a known method is selected and (b) the caller
 * supplied the matching handler — e.g. `onPayNow` is only wired once the
 * checkout has produced an `order_id`, so before that the component is a pure
 * method picker.
 */
export function resolvePaymentCta(
  selected: string | null,
  handlers: { onPayNow?: () => void; onPayOnDelivery?: () => void },
): PaymentCta {
  if (selected === "paystack" && handlers.onPayNow) {
    return { kind: "paystack", label: CTA_LABELS.paystack };
  }
  if (selected === "pay_on_delivery" && handlers.onPayOnDelivery) {
    return { kind: "pay_on_delivery", label: CTA_LABELS.pay_on_delivery };
  }
  return null;
}
