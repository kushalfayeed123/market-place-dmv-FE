"use client";

import { ArrowLeft, Package, Truck } from "lucide-react";
import { formatMoney } from "../catalog/format";
import { formatOrderStatus } from "./orderListUtils";
import { normalizeOrderDetail } from "./orderDetailUtils";
import { FulfillmentTracker } from "../fulfillment/FulfillmentTracker";
import { isBlockedStatus, isTrackableStatus } from "../fulfillment/fulfillmentTrackerUtils";

export interface OrderDetailItemView {
  variant_id?: string;
  product_id?: string;
  product_name: string;
  variant_name?: string;
  sku?: string;
  quantity: number;
  unit_price: { amount: number; currency: string };
  line_total: { amount: number; currency: string };
}

export interface OrderDetailViewProps {
  id?: string;
  order_number?: string;
  status?: string;
  total?: { amount: number; currency: string };
  /** Flat backend fallback shape (OrderResponse): total_amount + currency. */
  total_amount?: number;
  currency?: string;
  item_count?: number;
  created_at?: string;
  updated_at?: string;
  merchant_name?: string;
  items?: Array<Partial<OrderDetailItemView> & Record<string, unknown>>;
  subtotal?: { amount: number; currency: string };
  payment_status?: string | null;
  fulfillment_status?: string | null;
  delivery_address?: Record<string, unknown> | null;
  /** Hide the back button when the detail is shown standalone. */
  onBack?: () => void;
  /** Render the fulfillment tracker for shippable orders. */
  onTrack?: () => void;
}



function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const tone =
    s === "delivered" || s === "fulfilled" || s === "paid"
      ? "bg-[var(--color-success-bg)] text-[var(--color-success-fg)]"
      : s === "cancelled" || s === "refunded"
        ? "bg-[var(--color-danger-bg)] text-[var(--color-danger-fg)]"
        : s === "awaiting_approval" || s === "pending"
          ? "bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]"
          : "bg-[var(--color-primary-soft)] text-[var(--color-primary)]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {formatOrderStatus(status)}
    </span>
  );
}

/** Buyer-facing order detail — rendered from the agent's OrderDetail ui_directive. */
export function OrderDetailView({
  id,
  order_number,
  status,
  total,
  total_amount,
  currency,
  item_count,
  created_at,
  updated_at,
  merchant_name,
  items = [],
  subtotal,
  payment_status,
  fulfillment_status,
  delivery_address,
  onBack,
  onTrack,
}: OrderDetailViewProps) {
  // Defensive normalization: the directive should carry the view DTO, but
  // tolerate the flat backend shape so a missing `total` can never crash.
  const { order_number: num, status: orderStatus, total: totalPrice, subtotal: subtotalPrice, items: normalizedItems } =
    normalizeOrderDetail({ id, order_number, status, total, total_amount, currency, items, subtotal });
  // Trackable unless the order/fulfillment is in a blocked terminal state.
  const effectiveStatus = fulfillment_status ?? orderStatus;
  const trackable = !isBlockedStatus(effectiveStatus) && isTrackableStatus(effectiveStatus);
  const addr = delivery_address ?? null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to orders"
              className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm text-[var(--color-muted)] hover:bg-slate-100 hover:text-[var(--color-foreground)]"
            >
              <ArrowLeft size={15} /> Back
            </button>
          )}
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
              <Package size={16} className="text-[var(--color-primary)]" />
              Order {num}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              {merchant_name ? `${merchant_name} · ` : ""}
              {item_count ?? normalizedItems.length} item{(item_count ?? normalizedItems.length) === 1 ? "" : "s"} · placed {fmtDate(created_at)}
            </p>
          </div>
        </div>
        <StatusPill status={orderStatus} />
      </div>

      <div className="space-y-4 px-5 py-4">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-[var(--color-muted)]">Total</dt>
            <dd className="font-[var(--font-mono)] font-semibold text-[var(--color-foreground)]">
              {formatMoney(totalPrice.amount, totalPrice.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--color-muted)]">Payment</dt>
            <dd className="font-medium text-[var(--color-foreground)]">{payment_status ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--color-muted)]">Fulfillment</dt>
            <dd className="font-medium text-[var(--color-foreground)]">{fulfillment_status ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--color-muted)]">Last updated</dt>
            <dd className="font-medium text-[var(--color-foreground)]">{fmtDate(updated_at ?? created_at)}</dd>
          </div>
        </dl>

        {normalizedItems.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold text-[var(--color-foreground)]">Items</h4>
            <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
              {normalizedItems.map((item, i) => (
                <li key={item.variant_id ?? item.product_id ?? i} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--color-foreground)]">{item.product_name}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {item.variant_name ? `${item.variant_name} · ` : ""}
                      Qty {item.quantity} × {formatMoney(item.unit_price.amount, item.unit_price.currency)}
                    </p>
                  </div>
                  <span className="shrink-0 font-[var(--font-mono)] text-sm font-semibold text-[var(--color-foreground)]">
                    {formatMoney(item.line_total.amount, item.line_total.currency)}
                  </span>
                </li>
              ))}
            </ul>
            {normalizedItems.length > 0 && (
              <p className="mt-2 text-right text-sm text-[var(--color-muted)]">
                Subtotal: <span className="font-[var(--font-mono)] font-semibold text-[var(--color-foreground)]">{formatMoney(subtotalPrice.amount, subtotalPrice.currency)}</span>
              </p>
            )}
          </div>
        )}

        {addr && Object.keys(addr).length > 0 && (
          <div>
            <h4 className="mb-1.5 text-sm font-semibold text-[var(--color-foreground)]">Delivery address</h4>
            <address className="text-sm not-italic text-[var(--color-muted)]">
              {Object.entries(addr)
                .filter(([, v]) => v != null && v !== "")
                .map(([k, v]) => (
                  <span key={k} className="block capitalize">
                    {k.replace(/_/g, " ")}: {String(v)}
                  </span>
                ))}
            </address>
          </div>
        )}

        {trackable && onTrack && (
          <button
            type="button"
            onClick={onTrack}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-slate-50 px-4 py-2.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
          >
            <Truck size={15} /> Track this order
          </button>
        )}
      </div>

      {trackable && (
        <div className="border-t border-[var(--color-border)] px-5 py-4">
          <FulfillmentTracker
            order={{
              id: id ?? "",
              order_number: num,
              // Prefer the real fulfillment status over the order status so
              // the tracker always matches the backend's fulfillment state.
              status: effectiveStatus,
              merchant_name: merchant_name ?? "Marketplace",
            }}
          />
        </div>
      )}
    </div>
  );
}
