import { Package, CheckCircle, Truck, MapPin, Clock, AlertCircle } from "lucide-react";
import {
  TRACKER_STEPS,
  aggregateFulfillmentStatus,
  isBlockedStatus,
  trackerStepIndex,
} from "./fulfillmentTrackerUtils";

const stepMeta: Record<(typeof TRACKER_STEPS)[number], { label: string; icon: React.ReactNode }> = {
  confirmed: { label: "Order Confirmed", icon: <CheckCircle size={16} /> },
  packed: { label: "Packed", icon: <Package size={16} /> },
  in_transit: { label: "In Transit", icon: <Truck size={16} /> },
  out_for_delivery: { label: "Out for Delivery", icon: <MapPin size={16} /> },
  delivered: { label: "Delivered", icon: <CheckCircle size={16} /> },
};

export interface FulfillmentInfo {
  status?: string | null;
  carrier?: string | null;
  tracking_number?: string | null;
  delivered_at?: string | null;
}

export interface FulfillmentTrackerProps {
  order: { id: string; order_number: string; status: string; merchant_name: string };
  /**
   * Actual fulfillment records for the order (from GET /fulfillment/order/{id}).
   * When present, the tracker step is derived from these real statuses — not
   * just the order status — so it always matches the backend state.
   */
  fulfillments?: FulfillmentInfo[];
}

/**
 * Buyer-facing order tracker. The progress step is computed from the real
 * fulfillment statuses (falling back to the order status) via
 * `trackerStepIndex`, so it can never disagree with the backend.
 * Carrier / tracking / delivered-at are shown only when the backend
 * actually provided them — no hardcoded ETA or courier.
 */
export function FulfillmentTracker({ order, fulfillments = [] }: FulfillmentTrackerProps) {
  const fulfillmentStatuses = fulfillments.map((f) => f.status ?? "");
  const displayStatus =
    fulfillments.length > 0 ? aggregateFulfillmentStatus(fulfillmentStatuses) : order.status;
  const currentStep = trackerStepIndex(displayStatus);
  const blocked = isBlockedStatus(displayStatus);

  // Real shipment details from the most progressed fulfillment, when present.
  const shipped = fulfillments
    .filter((f) => trackerStepIndex(f.status ?? "") >= 2)
    .sort((a, b) => trackerStepIndex(b.status ?? "") - trackerStepIndex(a.status ?? ""))[0];
  const carrier = shipped?.carrier ?? null;
  const tracking = shipped?.tracking_number ?? null;
  const deliveredAt = fulfillments.find((f) => (f.status ?? "").startsWith("delivered"))?.delivered_at;

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <h3 className="font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <Truck size={16} className="text-[var(--color-primary)]" /> Order Tracking
        </h3>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">{order.order_number} · {order.merchant_name}</p>
      </div>

      <div className="px-4 py-6 sm:px-6">
        {blocked ? (
          <div className="flex items-center gap-3 rounded-xl bg-[var(--color-danger-bg)] p-4">
            <AlertCircle size={16} className="shrink-0 text-[var(--color-danger-fg)]" />
            <p className="text-sm font-medium text-[var(--color-danger-fg)]">
              This order is {displayStatus} — tracking is no longer available.
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-[var(--color-border)]" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-[var(--color-primary)] transition-all duration-500"
              style={{ width: `${(currentStep / (TRACKER_STEPS.length - 1)) * 100}%` }}
            />
            <div className="relative flex justify-between">
              {TRACKER_STEPS.map((key, i) => {
                const done = i <= currentStep;
                const active = i === currentStep;
                const meta = stepMeta[key];
                return (
                  <div key={key} className="flex min-w-0 flex-1 flex-col items-center gap-1 sm:gap-2">
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center z-10 transition-colors ${done ? "bg-[var(--color-primary)] text-white" : "bg-white border-2 border-[var(--color-border)] text-[var(--color-muted)]"} ${active ? "ring-4 ring-[var(--color-primary)]/20" : ""}`}>
                      {meta.icon}
                    </div>
                    <span className={`text-[10px] font-medium text-center leading-tight ${done ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"}`}>
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Real shipment details only — never a fabricated ETA/courier. */}
        {!blocked && currentStep >= 2 && (
          <div className="mt-6 rounded-xl bg-blue-50 p-4 flex items-center gap-3">
            <Clock size={16} className="shrink-0 text-[var(--color-primary)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-foreground)]">
                {currentStep >= 4 ? "Package delivered" : "Your package is on its way"}
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                {carrier ? `via ${carrier}` : "with the carrier"}
                {tracking ? ` · tracking ${tracking}` : ""}
                {deliveredAt ? ` · delivered ${new Date(deliveredAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}` : ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
