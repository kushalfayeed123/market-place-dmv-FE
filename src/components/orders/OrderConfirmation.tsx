import { CheckCircle, Package } from "lucide-react";

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100);
}

export function OrderConfirmation({ order }: { order: { id: string; order_number: string; total: { amount: number; currency: string }; merchant_name: string; items?: { product_name: string; quantity: number; unit_price: { amount: number; currency: string } }[] } }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--color-success-fg)]/20 shadow-[var(--shadow)] overflow-hidden">
      <div className="bg-[var(--color-success-bg)] px-5 py-6 flex flex-col items-center text-center gap-2">
        <div className="w-14 h-14 rounded-full bg-[var(--color-success-fg)]/10 flex items-center justify-center mb-1">
          <CheckCircle size={28} className="text-[var(--color-success-fg)]" />
        </div>
        <h3 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-foreground)]">Order Confirmed!</h3>
        <p className="text-sm text-[var(--color-muted)]">Your order has been placed and is being processed.</p>
        <span className="font-[var(--font-mono)] font-bold text-lg text-[var(--color-success-fg)]">{order.order_number}</span>
      </div>
      <div className="px-5 py-4 border-t border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-muted)] mb-3">Order summary</p>
        {order.items?.map((item, i) => (
          <div key={i} className="flex items-center justify-between py-2 text-sm">
            <div className="flex items-center gap-2">
              <Package size={13} className="text-[var(--color-muted)]" />
              <span>{item.product_name} × {item.quantity}</span>
            </div>
            <span className="font-[var(--font-mono)] font-medium">{fmt(item.unit_price.amount * item.quantity, item.unit_price.currency)}</span>
          </div>
        ))}
        <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between font-semibold">
          <span>Total</span>
          <span className="font-[var(--font-mono)] text-[var(--color-success-fg)]">{fmt(order.total.amount, order.total.currency)}</span>
        </div>
      </div>
    </div>
  );
}
