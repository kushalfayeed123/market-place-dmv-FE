import { Package } from "lucide-react";
import { MONEY } from "@/components/merchant/orderDetailUtils";
import type { MerchantOrderItemDetail } from "@/lib/api/client";

interface MerchantOrderLineItemsProps {
  items: MerchantOrderItemDetail[];
  currency: string;
  totalAmount: number; // full order total (merchant's items may be a subset)
}

/** Renders the line-item table for the merchant order detail page. */
export function MerchantOrderLineItems({
  items,
  currency,
  totalAmount,
}: MerchantOrderLineItemsProps) {
  const subtotal = items.reduce((s, i) => s + (i.line_total || 0), 0);

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-white">
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
          Items in this order
        </h2>
        <p className="text-xs text-[var(--color-muted)]">
          Showing the items you sell. Order total:{" "}
          <span className="font-[var(--font-mono)] text-[var(--color-foreground)]">
            {MONEY(totalAmount, currency)}
          </span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-gray-50 text-left text-xs font-medium text-[var(--color-muted)]">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Unit price</th>
              <th className="px-4 py-3 text-right">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-gray-50/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {it.image_url ? (
                      <img
                        src={it.image_url}
                        alt={it.product_title}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-[var(--color-muted)]">
                        <Package size={18} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--color-foreground)]">
                        {it.product_title}
                      </p>
                      {it.variant_sku && (
                        <p className="text-xs text-[var(--color-muted)]">
                          SKU: {it.variant_sku}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">{it.quantity}</td>
                <td className="px-4 py-3 text-right">{MONEY(it.unit_price, it.currency)}</td>
                <td className="px-4 py-3 text-right font-[var(--font-mono)]">
                  {MONEY(it.line_total, it.currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[var(--color-border)]">
              <td colSpan={3} className="px-4 py-3 text-right text-sm text-[var(--color-muted)]">
                Merchant subtotal
              </td>
              <td className="px-4 py-3 text-right font-[var(--font-mono)] text-sm text-[var(--color-foreground)]">
                {MONEY(subtotal, currency)}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-[var(--color-foreground)]">
                Order total
              </td>
              <td className="px-4 py-3 text-right font-[var(--font-mono)] font-semibold text-[var(--color-foreground)]">
                {MONEY(totalAmount, currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
