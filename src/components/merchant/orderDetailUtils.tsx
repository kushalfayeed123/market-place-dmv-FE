import { CheckCircle, Clock, Package, Truck, XCircle } from "lucide-react";
import { formatMoney } from "@/components/catalog/format";

/** Convert minor units (kobo/cents) → a formatted money string. */
export const MONEY = (n: number, c: string) => formatMoney(n ?? 0, c || "NGN");

export const STATUS_TONE: Record<string, string> = {
  pending: "bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]",
  awaiting_approval: "bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]",
  paid: "bg-[var(--color-success-bg)] text-[var(--color-success-fg)]",
  partially_fulfilled: "bg-[var(--color-info-bg)] text-[var(--color-info-fg)]",
  fulfilled: "bg-[var(--color-success-bg)] text-[var(--color-success-fg)]",
  cancelled: "bg-[var(--color-danger-bg)] text-[var(--color-danger-fg)]",
  refunded: "bg-[var(--color-danger-bg)] text-[var(--color-danger-fg)]",
};
export const statusTone = (s: string) => STATUS_TONE[s] || "bg-gray-100 text-gray-600";
export const statusLabel = (s: string) => (s ? s.replace(/_/g, " ") : "—");

export function fmtDate(v: string | null | undefined): string {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return v;
  }
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusTone(status)}`}
      title={status}
    >
      {statusLabel(status)}
    </span>
  );
}

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-[var(--color-muted)]">{label}</span>
      <span className="text-sm text-[var(--color-foreground)] break-words">{value}</span>
    </div>
  );
}

export function PaymentStatusPill({ status }: { status: string | null | undefined }) {
  const text = status ? status.replace(/_/g, " ") : "Unknown";
  const tone =
    status === "paid"
      ? "bg-[var(--color-success-bg)] text-[var(--color-success-fg)]"
      : status === "failed"
        ? "bg-[var(--color-danger-bg)] text-[var(--color-danger-fg)]"
        : "bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tone}`}
    >
      {text}
    </span>
  );
}

export function FulfillmentIcon({ status }: { status: string }) {
  if (status === "delivered" || status === "delivered_digital")
    return <CheckCircle size={16} className="text-[var(--color-success-fg)]" />;
  if (status === "shipped")
    return <Truck size={16} className="text-[var(--color-primary)]" />;
  if (status === "failed")
    return <XCircle size={16} className="text-[var(--color-danger-fg)]" />;
  if (status === "pending")
    return <Clock size={16} className="text-[var(--color-warning-fg)]" />;
  return <Package size={16} className="text-[var(--color-muted)]" />;
}
