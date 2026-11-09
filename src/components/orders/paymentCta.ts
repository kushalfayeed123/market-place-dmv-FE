/**
 * Pure CTA-resolution logic for `PaymentSelection.tsx`.
 *
 * Extracted so the decision — which call-to-action (if any) to render for the
 * currently selected payment method — can be unit-tested without a DOM/JSX
 * transform. The component imports the same function, keeping a single source
 * of truth.
 */

export type PaymentCtaKind = "paystack" | "pay_on_delivery" | "confirm";

export type PaymentCta =
  | { kind: PaymentCtaKind; label: string }
  | null;

const CTA_LABELS: Record<PaymentCtaKind, string> = {
  paystack: "Proceed to Paystack",
  pay_on_delivery: "Confirm Pay on Delivery",
  confirm: "Confirm payment method",
};

/**
 * Resolve the footer CTA for the current selection.
 *
 * A CTA only exists when (a) a method is selected and (b) the caller supplied
 * a matching handler — e.g. `onPayNow` is only wired once the checkout has
 * produced an `order_id`, so before that the component is a pure method
 * picker. Any other (dynamically listed) method falls back to the generic
 * `onConfirm` handler so the buyer can pay with whatever method the backend
 * advertised — nothing is hardcoded to Paystack/Pay-on-Delivery.
 */
export function resolvePaymentCta(
  selected: string | null,
  handlers: { onPayNow?: () => void; onPayOnDelivery?: () => void; onConfirm?: (method: string) => void },
): PaymentCta {
  if (selected === "paystack" && handlers.onPayNow) {
    return { kind: "paystack", label: CTA_LABELS.paystack };
  }
  if (selected === "pay_on_delivery" && handlers.onPayOnDelivery) {
    return { kind: "pay_on_delivery", label: CTA_LABELS.pay_on_delivery };
  }
  if (selected && handlers.onConfirm) {
    return { kind: "confirm", label: CTA_LABELS.confirm };
  }
  return null;
}
