import { describe, expect, it } from "vitest";
import { normalizeOrderDetail } from "./orderDetailUtils";

describe("normalizeOrderDetail", () => {
  it("passes through the agent view-DTO shape (PriceView total/items)", () => {
    const out = normalizeOrderDetail({
      id: "o1",
      order_number: "ORD-20261109-190345-17ec",
      status: "paid",
      total: { amount: 100800, currency: "NGN" },
      items: [
        {
          variant_id: "v1",
          product_name: "Wallet",
          quantity: 2,
          unit_price: { amount: 50400, currency: "NGN" },
          line_total: { amount: 100800, currency: "NGN" },
        },
      ],
    });
    expect(out.total).toEqual({ amount: 100800, currency: "NGN" });
    expect(out.status).toBe("paid");
    expect(out.items[0].line_total.amount).toBe(100800);
  });

  it("falls back to the flat backend shape (total_amount + flat item prices) — the crash case", () => {
    // This is the raw OrderResponse shape that previously crashed with
    // "Cannot read properties of undefined (reading 'amount')".
    const out = normalizeOrderDetail({
      id: "o1",
      order_number: "ORD-20261109-190345-17ec",
      status: "paid",
      currency: "NGN",
      total_amount: 100800,
      items: [
        {
          variant_id: "v1",
          product_name: "Wallet",
          quantity: 2,
          unit_price: 50400, // flat int, not a PriceView
          line_total: 100800,
          currency: "NGN",
        } as never,
      ],
    });
    expect(out.total).toEqual({ amount: 100800, currency: "NGN" });
    expect(out.items[0].unit_price).toEqual({ amount: 50400, currency: "NGN" });
    expect(out.items[0].line_total).toEqual({ amount: 100800, currency: "NGN" });
  });

  it("never crashes on empty/missing props", () => {
    const out = normalizeOrderDetail({});
    expect(out.total).toEqual({ amount: 0, currency: "NGN" });
    expect(out.subtotal).toEqual({ amount: 0, currency: "NGN" });
    expect(out.status).toBe("pending");
    expect(out.order_number).toBe("—");
    expect(out.items).toEqual([]);
  });

  it("derives the subtotal from line items when the directive subtotal is missing or zero", () => {
    const out = normalizeOrderDetail({
      order_number: "ORD-1",
      status: "paid",
      currency: "NGN",
      total_amount: 201600,
      // The bug case: agent mapped subtotal from a missing backend field → ₦0
      subtotal: { amount: 0, currency: "NGN" },
      items: [
        { product_name: "A", quantity: 1, unit_price: 100800, line_total: 100800, currency: "NGN" } as never,
        { product_name: "B", quantity: 2, unit_price: 50400, line_total: 100800, currency: "NGN" } as never,
      ],
    });
    expect(out.subtotal).toEqual({ amount: 201600, currency: "NGN" });
  });

  it("keeps a real declared subtotal when present", () => {
    const out = normalizeOrderDetail({
      order_number: "ORD-1",
      subtotal: { amount: 999, currency: "NGN" },
      items: [{ product_name: "A", quantity: 1, unit_price: 100, line_total: 100, currency: "NGN" } as never],
    });
    expect(out.subtotal).toEqual({ amount: 999, currency: "NGN" });
  });
});
