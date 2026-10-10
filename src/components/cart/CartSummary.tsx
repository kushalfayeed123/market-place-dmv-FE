"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Minus, Plus, ShoppingBag, Trash2, Undo2 } from "lucide-react";
import { formatMoney } from "../catalog/format";

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
  /** Optional per-line cap the backend can send (stock the shopper may still hold). */
  max_quantity?: number | null;
}

/** One line the shopper changed. quantity 0 means remove. Quantities are absolute, not deltas. */
export interface CartChange {
  variant_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
}

export interface CartSummaryProps {
  items: CartItem[];
  subtotal: { amount: number; currency: string };
  item_count: number;
  currency: string;
  is_empty: boolean;
  warnings?: string[];
  /** Set by the app on the turn that added a product, so that line is highlighted. */
  highlight_product_id?: string;
  /** Older carts in the transcript are read-only; only the latest one is editable. */
  readOnly?: boolean;
  onCheckout?: () => void;
  onUpdateItems?: (changes: CartChange[]) => void;
}

const HARD_MAX = 99;
const showVariant = (name: string) => !!name && !/^(default|default variant|standard)$/i.test(name.trim());

export function CartSummary({
  items,
  subtotal,
  item_count,
  warnings = [],
  is_empty,
  highlight_product_id,
  readOnly,
  onCheckout,
  onUpdateItems,
}: CartSummaryProps) {
  // Drafts only hold lines the shopper changed; they reset whenever the server cart changes.
  const serverKey = items.map((i) => `${i.variant_id}:${i.quantity}`).join("|");
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  useEffect(() => setDrafts({}), [serverKey]);

  if (is_empty || items.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center">
        <ShoppingBag size={40} className="mx-auto mb-3 text-slate-200" />
        <p className="text-sm text-[var(--color-muted)]">Your cart is empty</p>
      </div>
    );
  }

  const qtyOf = (i: CartItem) => drafts[i.variant_id] ?? i.quantity;
  const setQty = (i: CartItem, q: number) =>
    setDrafts((prev) => {
      const next = { ...prev };
      if (q === i.quantity) delete next[i.variant_id];
      else next[i.variant_id] = q;
      return next;
    });

  const changes: CartChange[] = items
    .filter((i) => qtyOf(i) !== i.quantity)
    .map((i) => ({ variant_id: i.variant_id, product_id: i.product_id, product_name: i.product_name, quantity: qtyOf(i) }));
  const dirty = changes.length > 0;
  const currency = subtotal.currency;
  const draftSubtotal = items.reduce((s, i) => s + i.unit_price.amount * qtyOf(i), 0);
  const added = highlight_product_id ? items.find((i) => i.product_id === highlight_product_id) : undefined;
  const stepBtn =
    "flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <h3 className="flex items-center gap-2 font-semibold">
          <ShoppingBag size={16} className="text-[var(--color-primary)]" />
          {readOnly ? "Earlier cart" : "Your cart"}
          <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[11px] font-semibold text-white">{item_count}</span>
        </h3>
      </div>

      {added && !readOnly && (
        <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-xl bg-[var(--color-success-bg)] px-4 py-3 text-sm text-[var(--color-success-fg)]">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>
            <span className="font-medium">{added.product_name}</span> was added. Need more? Change the quantity below.
          </p>
        </div>
      )}

      <ul className="divide-y divide-[var(--color-border)]">
        {items.map((item) => {
          const q = qtyOf(item);
          const removing = q === 0;
          const max = Math.min(item.max_quantity ?? HARD_MAX, HARD_MAX);
          const isNew = !readOnly && item.product_id === highlight_product_id;
          return (
            <li key={item.variant_id} className={"flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-4 " + (isNew ? "bg-[var(--color-primary-soft)]" : "")}>
              <div className={"min-w-0 flex-1 basis-48 " + (removing ? "opacity-50" : "")}>
                <p className={"truncate text-sm font-medium " + (removing ? "line-through" : "")}>{item.product_name}</p>
                {showVariant(item.variant_name) && <p className="mt-0.5 text-xs text-[var(--color-muted)]">{item.variant_name}</p>}
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">{formatMoney(item.unit_price.amount, item.unit_price.currency)} each</p>
              </div>

              {readOnly ? (
                <span className="text-sm text-[var(--color-muted)]">Qty {item.quantity}</span>
              ) : removing ? (
                <button type="button" onClick={() => setQty(item, item.quantity)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]">
                  <Undo2 size={14} /> Undo remove
                </button>
              ) : (
                <div className="flex items-center gap-2" role="group" aria-label={`Quantity for ${item.product_name}`}>
                  <button type="button" className={stepBtn} disabled={q <= 1} onClick={() => setQty(item, q - 1)} aria-label={`Decrease quantity of ${item.product_name}`}>
                    <Minus size={15} />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{q}</span>
                  <button type="button" className={stepBtn} disabled={q >= max} onClick={() => setQty(item, q + 1)} aria-label={`Increase quantity of ${item.product_name}`}>
                    <Plus size={15} />
                  </button>
                  <button type="button" onClick={() => setQty(item, 0)} aria-label={`Remove ${item.product_name}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-[var(--color-danger)]">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              <span className={"w-24 text-right font-[var(--font-mono)] text-sm font-semibold " + (removing ? "opacity-40" : "")}>
                {formatMoney(item.unit_price.amount * q, item.line_total.currency)}
              </span>
            </li>
          );
        })}
      </ul>

      {warnings.length > 0 && (
        <div className="mx-5 my-3 rounded-lg bg-[var(--color-warning-bg)] p-3">
          {warnings.map((w) => (
            <p key={w} className="text-sm text-[var(--color-warning-fg)]">{w}</p>
          ))}
        </div>
      )}

      <div className="border-t border-[var(--color-border)] bg-slate-50/60 px-5 py-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-[var(--color-muted)]">{dirty ? "New subtotal" : "Subtotal"}</span>
          <span className="font-[var(--font-mono)] text-lg font-bold">{formatMoney(dirty ? draftSubtotal : subtotal.amount, currency)}</span>
        </div>

        {!readOnly &&
          (dirty ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => setDrafts({})} className="h-11 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm font-medium hover:border-[var(--color-primary)]">
                Reset
              </button>
              <button type="button" onClick={() => onUpdateItems?.(changes)} className="h-11 flex-1 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]">
                Update cart ({changes.length} {changes.length === 1 ? "change" : "changes"})
              </button>
            </div>
          ) : (
            <button type="button" onClick={onCheckout} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] font-semibold text-white hover:bg-[var(--color-primary-hover)]">
              <CreditCard size={16} /> Proceed to checkout
            </button>
          ))}
      </div>
    </div>
  );
}
