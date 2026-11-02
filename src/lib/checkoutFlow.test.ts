import { describe, expect, it } from "vitest";
import { resolveCheckoutFulfillment } from "./checkoutFlow";

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
