import { Package, Clock, Truck, CheckCircle, XCircle } from "lucide-react";

export interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total: { amount: number; currency: string };
  items_count: number;
  merchant_name: string;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  processing: { label: "Processing", icon: <Clock size={12} />, color: "text-[var(--color-warning-fg)]", bg: "bg-[var(--color-warning-bg)]" },
  in_transit: { label: "In Transit", icon: <Truck size={12} />, color: "text-[var(--color-primary)]", bg: "bg-blue-50" },
  delivered: { label: "Delivered", icon: <CheckCircle size={12} />, color: "text-[var(--color-success-fg)]", bg: "bg-[var(--color-success-bg)]" },
  cancelled: { label: "Cancelled", icon: <XCircle size={12} />, color: "text-[var(--color-danger-fg)]", bg: "bg-[var(--color-danger-bg)]" },
};

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100);
}

export function OrderList({ orders, onTrack }: { orders: Order[]; onTrack?: (order: Order) => void }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <h3 className="font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <Package size={16} className="text-[var(--color-primary)]" /> Orders
        </h3>
      </div>
      <ul className="divide-y divide-[var(--color-border)]">
        {orders.map((order) => {
          const s = statusConfig[order.status] ?? statusConfig["processing"];
          return (
            <li key={order.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-[var(--font-mono)] font-medium text-sm text-[var(--color-foreground)]">{order.order_number}</span>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.color} ${s.bg}`}>
                    {s.icon}{s.label}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted)]">{order.merchant_name} · {order.items_count} item{order.items_count !== 1 ? "s" : ""}</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">{new Date(order.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="font-[var(--font-mono)] font-semibold text-sm text-[var(--color-foreground)]">
                  {fmt(order.total.amount, order.total.currency)}
                </span>
                {order.status === "in_transit" && (
                  <button
                    onClick={() => onTrack?.(order)}
                    className="text-[10px] font-semibold text-[var(--color-primary)] hover:underline"
                  >
                    Track →
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
