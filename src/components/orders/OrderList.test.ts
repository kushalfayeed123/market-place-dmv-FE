import { describe, expect, it } from "vitest";
import { formatOrderStatus, normalizeOrderListItem, orderStatusNote } from "./orderListUtils";

describe("orderStatusNote", () => {
  it("gives a calm note for buyer-visible milestones", () => {
    expect(orderStatusNote("paid")).toMatch(/payment confirmed/i);
    expect(orderStatusNote("accepted")).toMatch(/accepted/i);
    expect(orderStatusNote("awaiting_approval")).toMatch(/pay-on-delivery/i);
    expect(orderStatusNote("shipped")).toMatch(/on its way/i);
    expect(orderStatusNote("delivered")).toMatch(/delivered/i);
    expect(orderStatusNote("fulfilled")).toMatch(/delivered/i);
  });

  it("returns null for statuses that need no note", () => {
    expect(orderStatusNote("pending")).toBeNull();
    expect(orderStatusNote("")).toBeNull();
  });
});

describe("normalizeOrderListItem", () => {
  it("normalizes the backend order response shape", () => {
    expect(
      normalizeOrderListItem({
        id: "order-1",
        order_number: "ORD-001",
        status: "pending",
        created_at: "2026-10-27T10:00:00Z",
        total_amount: 12500,
        currency: "NGN",
        item_count: 2,
      }),
    ).toEqual({
      id: "order-1",
      order_number: "ORD-001",
      status: "pending",
      created_at: "2026-10-27T10:00:00Z",
      total: { amount: 12500, currency: "NGN" },
      items_count: 2,
      merchant_name: "Marketplace",
    });

  });

  it("keeps the existing agent order summary shape", () => {
    expect(
      normalizeOrderListItem({
        id: "order-2",
        status: "delivered",
        total: { amount: 2400, currency: "USD" },
        items_count: 1,
        merchant_name: "Shop",
      }),
    ).toMatchObject({
      total: { amount: 2400, currency: "USD" },
      merchant_name: "Shop",
    });
  });

  describe("formatOrderStatus", () => {
    it.each([
      ["pending", "Pending"],
      ["paid", "Paid"],
      ["accepted", "Accepted"],
      ["partially_fulfilled", "Partially fulfilled"],
      ["shipped", "Shipped"],
      ["fulfilled", "Fulfilled"],
      ["awaiting_approval", "Awaiting approval"],
      ["cancelled", "Cancelled"],
      ["refunded", "Refunded"],
    ])("shows backend order status %s as %s", (status, label) => {
      expect(formatOrderStatus(status)).toBe(label);
    });

    it("preserves unknown backend statuses instead of labelling them processing", () => {
      expect(formatOrderStatus("payment_review")).toBe("Payment Review");
    });
  });

  it("rejects values that cannot identify an order", () => {
    expect(normalizeOrderListItem(null)).toBeNull();
    expect(normalizeOrderListItem({ status: "pending" })).toBeNull();
  });
});
