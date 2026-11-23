import { describe, expect, it } from "vitest";
import { isCheckoutComplete, resolveCheckoutFulfillment } from "./checkoutFlow";

describe("resolveCheckoutFulfillment", () => {
  it("requires delivery for physical products", () => {
    expect(resolveCheckoutFulfillment([
      { fulfillment_type: "physical", product_types: ["physical"] },
    ])).toBe("delivery");
  });

  it("requires delivery for mixed digital and physical carts", () => {
    expect(resolveCheckoutFulfillment([
      { fulfillment_type: "digital", product_types: ["digital"] },
      { fulfillment_type: "physical", product_types: ["physical"] },
    ])).toBe("delivery");
  });

  it("does not require a delivery address for digital-only carts", () => {
    expect(resolveCheckoutFulfillment([
      { fulfillment_type: "digital", product_types: ["digital"] },
    ])).toBe("digital");
  });

  it("does not require a delivery address for service-only carts", () => {
    expect(resolveCheckoutFulfillment([
      { fulfillment_type: "service", product_types: ["service"] },
    ])).toBe("service");
  });
});

describe("isCheckoutComplete", () => {
  it("is complete when payment succeeded, regardless of order status", () => {
    expect(isCheckoutComplete({ payment: { status: "success" } }, null)).toBe(true);
    expect(isCheckoutComplete({ payment: { status: "success" } }, "pending")).toBe(true);
  });

  it("is complete for terminal/accepted order statuses even without a payment object", () => {
    for (const status of ["accepted", "fulfilled", "delivered", "cancelled", "refunded"]) {
      expect(isCheckoutComplete({}, status)).toBe(true);
    }
  });

  it("is not complete while the order/payment is still in progress", () => {
    expect(isCheckoutComplete({ payment: { status: "initialized" } }, "pending")).toBe(false);
    expect(isCheckoutComplete({ payment: { status: "pending_verification" } }, "awaiting_approval")).toBe(false);
    expect(isCheckoutComplete(null, null)).toBe(false);
  });
});
