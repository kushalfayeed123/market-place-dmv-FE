import { describe, it, expect } from "vitest";
import { resolvePaymentCta } from "./paymentCta";

const noop = () => {};

describe("resolvePaymentCta", () => {
  it("returns the Paystack CTA when paystack is selected and onPayNow is wired", () => {
    expect(resolvePaymentCta("paystack", { onPayNow: noop })).toEqual({
      kind: "paystack",
      label: "Proceed to Paystack",
    });
  });

  it("returns the Pay-on-delivery CTA when pay_on_delivery is selected and onPayOnDelivery is wired", () => {
    expect(resolvePaymentCta("pay_on_delivery", { onPayOnDelivery: noop })).toEqual({
      kind: "pay_on_delivery",
      label: "Confirm Pay on Delivery",
    });
  });

  it("returns null when no method is selected yet", () => {
    expect(resolvePaymentCta(null, { onPayNow: noop, onPayOnDelivery: noop })).toBeNull();
  });

  it("returns null when the selected method has no matching handler (e.g. no order_id yet)", () => {
    // The directive renderer only wires onPayNow once props.order_id exists.
    expect(resolvePaymentCta("paystack", { onPayOnDelivery: noop })).toBeNull();
    expect(resolvePaymentCta("pay_on_delivery", { onPayNow: noop })).toBeNull();
    expect(resolvePaymentCta("paystack", {})).toBeNull();
  });

  it("returns null for an unknown method key", () => {
    expect(
      resolvePaymentCta("bank_transfer", { onPayNow: noop, onPayOnDelivery: noop }),
    ).toBeNull();
  });
});