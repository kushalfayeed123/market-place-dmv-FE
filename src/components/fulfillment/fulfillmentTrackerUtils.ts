/**
 * Pure mapping between real backend statuses and the tracker's 5 steps.
 *
 * The backend has two related status vocabularies:
 *  - order statuses:      pending, accepted, paid, awaiting_approval,
 *                         partially_fulfilled, shipped, fulfilled, cancelled, refunded
 *  - fulfillment statuses: pending, shipped, delivered, delivered_digital, failed
 * The tracker must map BOTH consistently onto:
 *   confirmed(0) → packed(1) → in_transit(2) → out_for_delivery(3) → delivered(4)
 */

export const TRACKER_STEPS = [
  "confirmed",
  "packed",
  "in_transit",
  "out_for_delivery",
  "delivered",
] as const;

export type TrackerStep = (typeof TRACKER_STEPS)[number];

/** Statuses where the order can no longer be delivered — show a note, not progress. */
const BLOCKED = new Set(["cancelled", "refunded", "failed"]);

export function isBlockedStatus(status: string | null | undefined): boolean {
  return BLOCKED.has((status ?? "").trim().toLowerCase());
}

/** Map any order/fulfillment status to a tracker step index (0–4). */
export function trackerStepIndex(status: string | null | undefined): number {
  switch ((status ?? "").trim().toLowerCase()) {
    case "delivered":
    case "fulfilled":
    case "delivered_digital":
      return 4;
    case "out_for_delivery":
      return 3;
    case "in_transit":
    case "shipped":
      return 2;
    case "packed":
    case "processing":
    case "partially_fulfilled":
      return 1;
    default:
      // pending, accepted, paid, awaiting_approval, unknown → confirmed
      return 0;
  }
}

export function isTrackableStatus(status: string | null | undefined): boolean {
  const s = (status ?? "").trim().toLowerCase();
  return !BLOCKED.has(s);
}

/**
 * Aggregate several fulfillment statuses (an order can have multiple
 * fulfillments, one per merchant) into a single display status: the most
 * progressed one wins; "failed" only surfaces when nothing has shipped yet.
 */
export function aggregateFulfillmentStatus(statuses: Array<string | null | undefined>): string {
  const list = (statuses ?? []).map((s) => (s ?? "").trim().toLowerCase()).filter(Boolean);
  if (!list.length) return "pending";
  const maxStep = Math.max(...list.map(trackerStepIndex));
  const top = list.find((s) => trackerStepIndex(s) === maxStep) ?? "pending";
  if (list.includes("failed") && maxStep < 2) return "failed";
  return top;
}
