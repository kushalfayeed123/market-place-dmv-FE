export interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total: { amount: number; currency: string };
  items_count: number;
  merchant_name: string;
}

export function formatOrderStatus(status: string): string {
  const knownLabels: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    accepted: "Accepted",
    partially_fulfilled: "Partially fulfilled",
    shipped: "Shipped",
    fulfilled: "Fulfilled",
    awaiting_approval: "Awaiting approval",
    cancelled: "Cancelled",
    refunded: "Refunded",
    processing: "Processing",
    in_transit: "In transit",
    delivered: "Delivered",
  };
  const normalized = status.trim().toLowerCase();
  if (knownLabels[normalized]) return knownLabels[normalized];
  if (!normalized) return "Unknown";
  return normalized
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalizeOrderListItem(value: unknown): Order | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const id = String(raw.id ?? raw.order_number ?? "");
  if (!id) return null;

  const rawTotal =
    raw.total && typeof raw.total === "object"
      ? (raw.total as Record<string, unknown>)
      : {};
  const amount = Number(rawTotal.amount ?? raw.total_amount ?? 0);
  const rawCurrency = rawTotal.currency ?? raw.currency;
  const currency =
    typeof rawCurrency === "string" && /^[A-Z]{3}$/.test(rawCurrency)
      ? rawCurrency
      : "NGN";
  const count = Number(raw.items_count ?? raw.item_count ?? 0);

  return {
    id,
    order_number: String(raw.order_number ?? id),
    status: String(raw.status ?? "pending"),
    created_at: typeof raw.created_at === "string" ? raw.created_at : "",
    total: { amount: Number.isFinite(amount) ? amount : 0, currency },
    items_count: Number.isFinite(count) && count > 0 ? count : 0,
    merchant_name:
      typeof raw.merchant_name === "string" && raw.merchant_name
        ? raw.merchant_name
        : "Marketplace",
  };
}
