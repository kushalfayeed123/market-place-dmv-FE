import { CreditCard, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { resolvePaymentState, type PaymentInfo } from "./paymentState";
export type { PaymentStatus, PaymentCaptureState } from "./paymentState";

function fmt(amount: { amount: number; currency: string }) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: amount.currency,
    maximumFractionDigits: 0,
  }).format(amount.amount / 100);
}

export interface PaymentCapturePanelProps {
  order_id: string;
  order_number?: string;
  status: string;
  total?: { amount: number; currency: string };
  item_count?: number;
  payment_required?: boolean;
  message?: string;
  payment?: PaymentInfo;
  onPay: () => void;
  onPayOnDelivery?: () => void;
}

export function PaymentCapturePanel({
  order_id,
  order_number,
  status,
  total,
  item_count,
  payment_required,
  message,
  payment,
  onPay,
  onPayOnDelivery,
}: PaymentCapturePanelProps) {
  const {
    isPaid,
    isFailed,
    awaitingConfirmation,
    awaitingMerchant,
    showComplete,
    showPayNow,
    header,
  } = resolvePaymentState(status, payment, payment_required);

  if (isPaid) {
    return (
      <div className="rounded-xl border border-[var(--color-success-fg)]/20 bg-[var(--color-success-bg)]/10 p-6 text-center">
        <div className="mb-3 flex justify-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-success-fg)]/10 flex items-center justify-center">
            <CheckCircle size={24} className="text-[var(--color-success-fg)]" />
          </div>
        </div>
        <h3 className="font-semibold text-[var(--color-foreground)] mb-1">
          Payment Successful!
        </h3>
        <p className="text-sm text-[var(--color-muted)]">
          {order_number && <span>Order #{order_number}</span>}
          {total && <span> • Total: {fmt(total)}</span>}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
          <CreditCard size={20} className="text-[var(--color-primary)]" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--color-foreground)]">
            {header}
          </h3>
          <p className="text-sm text-[var(--color-muted)]">
            {message || "Awaiting payment confirmation."}
          </p>
        </div>
      </div>

      {order_number && (
        <div className="text-sm">
          <span className="text-[var(--color-muted)]">Order:</span>{" "}
          <span className="font-[var(--font-mono)] text-[var(--color-foreground)]">
            {order_number}
          </span>
        </div>
      )}

      {total && (
        <div className="text-sm">
          <span className="text-[var(--color-muted)]">Total:</span>{" "}
          <span className="font-semibold text-[var(--color-foreground)]">
            {fmt(total)}
          </span>
        </div>
      )}

      {item_count !== undefined && (
        <div className="text-sm">
          <span className="text-[var(--color-muted)]">Items:</span>{" "}
          <span className="text-[var(--color-foreground)]">{item_count}</span>
        </div>
      )}

      {awaitingMerchant && (
        <div className="rounded-lg border border-[var(--color-warning-fg)]/20 bg-[var(--color-warning-bg)]/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-[var(--color-warning-fg)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="font-medium text-[var(--color-warning-fg)]">Waiting for merchant to confirm payment</span>
          </div>
          <p className="text-sm text-[var(--color-muted)] mb-3">
            Your order is placed. Pay the delivery person when your order arrives, then the merchant will confirm your payment here.
          </p>
          {order_number && (
            <div className="text-sm">
              <span className="text-[var(--color-muted)]">Order:</span>{" "}
              <span className="font-[var(--font-mono)] text-[var(--color-foreground)]">{order_number}</span>
            </div>
          )}
          {total && (
            <div className="text-sm">
              <span className="text-[var(--color-muted)]">Total:</span>{" "}
              <span className="font-semibold text-[var(--color-foreground)]">{fmt(total)}</span>
            </div>
          )}
        </div>
      )}
      {isFailed && (
        <div className="rounded-lg bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger-fg)]">
          Payment failed. Please try again or contact support.
        </div>
      )}

      {awaitingConfirmation ? (
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <Loader2 size={16} className="animate-spin" />
          <span>Waiting for payment provider…</span>
        </div>
      ) : showComplete ? (
        <button
          onClick={(e) => {
            e.preventDefault();
            // showComplete guarantees a payment object with a payment_url.
            window.open(payment!.payment_url!, "_blank", "noopener,noreferrer");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          <ExternalLink size={16} />
          Complete Payment
        </button>
      ) : showPayNow ? (
        <div className="flex flex-col gap-2">
          <button
            onClick={onPay}
            className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Pay Now
          </button>
          {onPayOnDelivery && (
            <button
              onClick={onPayOnDelivery}
              className="w-full rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/50 transition-colors"
            >
              Pay on Delivery
            </button>
          )}
        </div>
      ) : null}

      <input type="hidden" name="order_id" value={order_id} readOnly />
    </div>
  );
}
