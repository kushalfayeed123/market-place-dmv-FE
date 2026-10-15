import { CreditCard, Loader2, CheckCircle, ExternalLink } from "lucide-react";

function fmt(amount: { amount: number; currency: string }) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: amount.currency,
    maximumFractionDigits: 0,
  }).format(amount.amount / 100);
}

export type PaymentStatus =
  | "pending"
  | "initialized"
  | "success"
  | "failed"
  | "paid"
  | "unknown";

export interface PaymentCapturePanelProps {
  order_id: string;
  order_number?: string;
  status: string;
  total?: { amount: number; currency: string };
  item_count?: number;
  payment_required?: boolean;
  message?: string;
  payment?: {
    id?: string;
    status?: string;
    amount?: { amount: number; currency: string };
    provider?: string;
    provider_reference?: string;
    payment_url?: string;
    created_at?: string;
    updated_at?: string;
  };
  onPay: () => void;
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
}: PaymentCapturePanelProps) {
  const payStatus = (payment?.status ?? status) as PaymentStatus;
  const isPaid = payStatus === "success" || payStatus === "paid";
  const isProcessing = payStatus === "initialized" || payStatus === "pending";

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
            {isProcessing ? "Processing Payment" : "Complete Your Payment"}
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

      {payStatus === "failed" && (
        <div className="rounded-lg bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger-fg)]">
          Payment failed. Please try again or contact support.
        </div>
      )}

      {isProcessing ? (
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <Loader2 size={16} className="animate-spin" />
          <span>Waiting for payment provider…</span>
        </div>
      ) : payment?.payment_url ? (
        <a
          href={payment.payment_url}
          onClick={() => {
            // In a real browser this navigates to the provider.
            // In the agent flow the href opens in a new tab/window.
            window.open(payment.payment_url!, "_blank", "noopener,noreferrer");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          <ExternalLink size={16} />
          Complete Payment
        </a>
      ) : payment_required !== false ? (
        <button
          onClick={onPay}
          className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Pay Now
        </button>
      ) : null}

      <input type="hidden" name="order_id" value={order_id} readOnly />
    </div>
  );
}
