import { ShoppingBag, Trash2, CreditCard } from "lucide-react";

export interface CartItem {
  variant_id: string;
  product_id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  quantity: number;
  unit_price: { amount: number; currency: string };
  line_total: { amount: number; currency: string };
  quantity_available: number;
}

export interface CartSummaryProps {
  items: CartItem[];
  subtotal: { amount: number; currency: string };
  item_count: number;
  currency: string;
  is_empty: boolean;
  warnings?: string[];
  onCheckout?: () => void;
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100);
}

export function CartSummary({ items, subtotal, item_count, is_empty, warnings = [], onCheckout }: CartSummaryProps) {
  if (is_empty) {
    return (
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-8 text-center">
        <ShoppingBag size={40} className="text-gray-200 mx-auto mb-3" />
        <p className="text-[var(--color-muted)] text-sm">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <h3 className="font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <ShoppingBag size={16} className="text-[var(--color-primary)]" />
          Cart
          <span className="ml-1 px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-white text-[11px] font-semibold">{item_count}</span>
        </h3>
      </div>

      <ul className="divide-y divide-[var(--color-border)]">
        {items.map((item) => (
          <li key={item.variant_id} className="px-5 py-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{item.product_name}</p>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">{item.variant_name} · SKU: {item.sku}</p>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">Qty: {item.quantity} × {fmt(item.unit_price.amount, item.unit_price.currency)}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-[var(--font-mono)] font-semibold text-sm text-[var(--color-foreground)]">
                {fmt(item.line_total.amount, item.line_total.currency)}
              </span>
              <button className="text-gray-300 hover:text-[var(--color-danger)] transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {warnings.length > 0 && (
        <div className="mx-5 my-3 p-3 bg-[var(--color-warning-bg)] rounded-lg">
          {warnings.map((w) => (
            <p key={w} className="text-xs text-[var(--color-warning-fg)]">{w}</p>
          ))}
        </div>
      )}

      <div className="px-5 py-4 border-t border-[var(--color-border)] bg-gray-50/50">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-[var(--color-muted)]">Subtotal</span>
          <span className="font-[var(--font-mono)] font-bold text-lg text-[var(--color-foreground)]">
            {fmt(subtotal.amount, subtotal.currency)}
          </span>
        </div>
        <button
          onClick={onCheckout}
          className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white rounded-xl px-6 py-3 font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          <CreditCard size={16} /> Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
