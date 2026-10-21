"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, RefreshCw, ShoppingBag } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { apiClient, ApiError, type MerchantOrderDetail } from "@/lib/api/client";
import { mreq } from "@/lib/api/merchant";
import { MerchantOrderCards } from "@/components/merchant/MerchantOrderCards";
import { MerchantOrderLineItems } from "@/components/merchant/MerchantOrderLineItems";
import { MerchantOrderActions } from "@/components/merchant/MerchantOrderActions";
import {
  StatusBadge,
  FulfillmentIcon,
  fmtDate,
} from "@/components/merchant/orderDetailUtils";
import type { OrderAction } from "@/components/merchant/orderActions";

type DeliveryAddress = Record<string, unknown> | null | undefined;

function DeliveryAddressCard({ address }: { address: DeliveryAddress }) {
  const a = (address ?? {}) as Record<string, string>;
  const hasAddress = address != null && Object.keys(address).length > 0;
  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-white">
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
          Delivery address
        </h2>
      </div>
      <div className="px-5 py-4">
        {hasAddress ? (
          <address className="text-sm text-[var(--color-foreground)] not-italic">
            {a.name && <strong className="block">{a.name}</strong>}
            {a.line1 && <span className="block">{a.line1}</span>}
            {a.line2 && <span className="block">{a.line2}</span>}
            {a.city && <span className="block">{a.city}</span>}
            {a.state && <span className="block">{a.state}</span>}
            {a.postal_code && <span className="block">{a.postal_code}</span>}
            {a.country && <span className="block">{a.country}</span>}
            {a.phone && (
              <span className="block text-[var(--color-muted)]">
                Phone: {a.phone}
              </span>
            )}
          </address>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">
            No delivery address captured.
          </p>
        )}
      </div>
    </section>
  );
}

export function MerchantOrderDetail({ orderId }: { orderId: string }) {
  const { user } = useAuth();
  const [merchant, setMerchant] = useState<any>(null);
  const [order, setOrder] = useState<MerchantOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<OrderAction | null>(null);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const m = await apiClient.getMyMerchant(user.id);
      setMerchant(m);
      const o = await apiClient.getMerchantOrder(m.id, orderId);
      setOrder(o);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setError("Order not found or you don't have access to it.");
      } else if (e instanceof ApiError && e.status === 403) {
        setError("You're not authorized to view this order.");
      } else {
        setError(e instanceof Error ? e.message : "Couldn't load this order. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, user?.id]);

  async function runAction(action: OrderAction) {
    setPendingAction(null);
    setBusy(true);
    setError(null);
    try {
      await mreq("POST", action.apiPath(orderId));
      setOrder(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : `${action.label} failed.`);
    } finally {
      setBusy(false);
    }
  }

  const onActionClick = (action: OrderAction) =>
    action.confirm ? setPendingAction(action) : runAction(action);

  if (!merchant && !loading) {
    return (
      <a
        href="/merchant/dashboard?section=orders"
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-foreground)] hover:bg-gray-50"
      >
        <ChevronLeft size={14} />
        Open the dashboard to set up your business
      </a>
    );
  }

  if (!merchant) {
    return (
      <div className="flex items-center gap-2 text-[var(--color-muted)]">
        <RefreshCw size={16} className="animate-spin" />
        <span>Loading order…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Back + header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <a
              href="/merchant/dashboard?section=orders"
              className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              <ChevronLeft size={14} />
              Orders
            </a>
            <span className="text-[var(--color-muted)]">/</span>
            <span className="font-[var(--font-mono)] text-sm text-[var(--color-foreground)]">
              {order ? order.order_number : ""}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {order && <StatusBadge status={order.status} />}
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] hover:bg-[var(--color-border)]"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-fg)]"
          >
            {error}
          </div>
        )}

        {!order && !loading && !error && (
          <div className="text-sm text-[var(--color-muted)]">
            No order data.
          </div>
        )}

        {order && (
          <>
            <header className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white px-5 py-4">
              <ShoppingBag size={20} className="text-[var(--color-primary)]" />
              <div>
                <p className="text-xs text-[var(--color-muted)]">
                  Placed {fmtDate(order.created_at)} · Updated {fmtDate(order.updated_at)}
                </p>
              </div>
            </header>

            <DeliveryAddressCard address={order.delivery_address} />

            <MerchantOrderCards order={order} />

            <MerchantOrderLineItems
              items={order.items}
              currency={order.currency}
              totalAmount={order.total_amount}
            />

            <section className="rounded-xl border border-[var(--color-border)] bg-white">
              <div className="px-5 py-4 border-b border-[var(--color-border)]">
                <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
                  Fulfillments
                </h2>
              </div>
              <div className="px-5 py-4">
                {order.fulfillments.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted)]">
                    No fulfillment activities recorded yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--color-border)]">
                    {order.fulfillments.map((f) => (
                      <li key={f.id} className="py-3">
                        <div className="flex items-center gap-2">
                          <FulfillmentIcon status={f.status} />
                          <StatusBadge status={f.status} />
                          <span className="text-xs text-[var(--color-muted)] capitalize">
                            ({f.type})
                          </span>
                        </div>
                        {f.carrier && (
                          <p className="mt-1 text-sm text-[var(--color-foreground)]">
                            {f.carrier}
                            {f.tracking_number && <> · TRK {f.tracking_number}</>}
                          </p>
                        )}
                        {f.delivered_at && (
                          <p className="mt-1 text-xs text-[var(--color-muted)]">
                            Delivered {fmtDate(f.delivered_at)}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <MerchantOrderActions
              status={order.status}
              busy={busy || loading}
              pendingAction={pendingAction}
              onActionClick={onActionClick}
              onConfirm={runAction}
              onCancelConfirm={() => setPendingAction(null)}
            />
          </>
        )}
    </div>
  );
}
