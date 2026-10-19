import { Mail, Phone } from "lucide-react";
import {
  MONEY,
  InfoRow,
  PaymentStatusPill,
  fmtDate,
} from "@/components/merchant/orderDetailUtils";
import type { MerchantOrderDetail } from "@/lib/api/client";

interface MerchantOrderCardsProps {
  order: MerchantOrderDetail;
}

/** Buyer · Payment (mode of payment) · Order summary cards. */
export function MerchantOrderCards({ order }: MerchantOrderCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      {/* Buyer */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
          Buyer
        </h2>
        <div className="space-y-2.5">
          {order.buyer.avatar_url ? (
            <img
              src={order.buyer.avatar_url}
              alt={order.buyer.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-[var(--color-foreground)]">
              {(order.buyer.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <InfoRow label="Name" value={order.buyer.name} />
          <div className="flex items-center gap-1.5 text-sm text-[var(--color-foreground)]">
            <Mail size={14} className="text-[var(--color-muted)]" />
            {order.buyer.email}
          </div>
          {order.buyer.phone && (
            <div className="flex items-center gap-1.5 text-sm text-[var(--color-foreground)]">
              <Phone size={14} className="text-[var(--color-muted)]" />
              {order.buyer.phone}
            </div>
          )}
          <InfoRow
            label="Buyer ID"
            value={
              <span className="font-[var(--font-mono)] text-xs break-all">
                {order.buyer.id}
              </span>
            }
          />
        </div>
      </div>

      {/* Payment (mode of payment) */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
          Payment
        </h2>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-muted)]">Mode</span>
            <span className="text-sm font-medium capitalize text-[var(--color-foreground)]">
              {order.payment?.provider || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-muted)]">Status</span>
            <PaymentStatusPill
              status={order.payment?.status ?? order.payment_status}
            />
          </div>
          {order.payment?.provider_reference && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-muted)]">Reference</span>
              <span className="break-all font-[var(--font-mono)] text-xs text-[var(--color-foreground)]">
                {order.payment.provider_reference}
              </span>
            </div>
          )}
          {order.payment?.amount != null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-muted)]">Amount</span>
              <span className="text-sm text-[var(--color-foreground)]">
                {MONEY(order.payment.amount, order.payment.currency || order.currency)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Order summary */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
          Order summary
        </h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-xs text-[var(--color-muted)]">Currency</dt>
          <dd className="text-[var(--color-foreground)]">{order.currency}</dd>
          <dt className="text-xs text-[var(--color-muted)]">Items</dt>
          <dd className="text-[var(--color-foreground)]">{order.item_count}</dd>
          <dt className="text-xs text-[var(--color-muted)]">Your items</dt>
          <dd className="text-[var(--color-foreground)]">
            {order.items.length} line{order.items.length !== 1 ? "s" : ""}
          </dd>
          <dt className="text-xs text-[var(--color-muted)]">Your subtotal</dt>
          <dd className="text-[var(--color-foreground)]">
            {MONEY(
              order.items.reduce((s, i) => s + (i.line_total || 0), 0),
              order.currency,
            )}
          </dd>
          <dt className="text-xs text-[var(--color-muted)]">Order total</dt>
          <dd className="font-[var(--font-mono)] font-semibold text-[var(--color-foreground)]">
            {MONEY(order.total_amount, order.currency)}
          </dd>
          <dt className="text-xs text-[var(--color-muted)]">Fulfillment</dt>
          <dd className="text-[var(--color-foreground)]">
            {order.fulfillment_status
              ? order.fulfillment_status.replace(/_/g, " ")
              : "—"}
          </dd>
          {order.fulfilled_at && (
            <>
              <dt className="text-xs text-[var(--color-muted)]">Fulfilled at</dt>
              <dd className="text-[var(--color-foreground)]">
                {fmtDate(order.fulfilled_at)}
              </dd>
            </>
          )}
          <dt className="text-xs text-[var(--color-muted)]">Idempotency key</dt>
          <dd className="break-all font-[var(--font-mono)] text-xs text-[var(--color-muted)]">
            {order.idempotency_key || "—"}
          </dd>
        </dl>
      </div>
    </div>
  );
}
