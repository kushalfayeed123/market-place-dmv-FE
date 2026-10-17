import { describe, it, expect } from "vitest";
import {
  resolvePaymentState,
  type PaymentInfo,
} from "./paymentState";

const stubPayment = (overrides: Partial<PaymentInfo> = {}): PaymentInfo => ({
  id: "pay_1",
  status: "initialized",
  amount: { amount: 18500, currency: "NGN" },
  provider: "paystack",
  provider_reference: "paystack_ord_ref_abc",
  payment_url: "https://pay.example.com/stub-callback?ref=paystack_ord_ref_abc",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  ...overrides,
});


describe("resolvePaymentState", () => {
  it("shows 'Pay Now' (not a spinner) after checkout: pending order, no payment started", () => {
    // This is the exact state the gateway emits for the `initiate_checkout`
    // directive (CheckoutView): status="pending", no `payment` object.
    const s = resolvePaymentState("pending", undefined, true);
    expect(s.isPaid).toBe(false);
    expect(s.awaitingConfirmation).toBe(false);
    expect(s.showPayNow).toBe(true);
    expect(s.showComplete).toBe(false);
    expect(s.header).toBe("Complete Your Payment");
  });

  it("shows 'Complete Payment' after process_payment returns an initialized payment with a redirect URL", () => {
    const s = resolvePaymentState(
      "pending",
      stubPayment({ status: "initialized" }),
      true,
    );
    expect(s.showComplete).toBe(true);
    expect(s.showPayNow).toBe(false);
    expect(s.awaitingConfirmation).toBe(false);
  });

  it("shows the spinner only when a payment exists and is pending (awaiting webhook after redirect)", () => {
    const s = resolvePaymentState(
      "pending",
      stubPayment({ status: "pending", payment_url: undefined }),
      true,
    );
    expect(s.awaitingConfirmation).toBe(true);
    expect(s.showPayNow).toBe(false);
    expect(s.showComplete).toBe(false);
    expect(s.header).toBe("Processing Payment");
  });

  it("marks the flow paid when status is 'success' or 'paid'", () => {
    expect(resolvePaymentState("success", undefined, true).isPaid).toBe(true);
    expect(
      resolvePaymentState("paid", stubPayment({ status: "paid" }), true).isPaid,
    ).toBe(true);
  });

  it("hides the Pay Now button when payment_required is false", () => {
    const s = resolvePaymentState("pending", undefined, false);
    expect(s.showPayNow).toBe(false);
    expect(s.showComplete).toBe(false);
    expect(s.awaitingConfirmation).toBe(false);
  });

  it("reports failed state for a 'failed' payment", () => {
    expect(
      resolvePaymentState("pending", stubPayment({ status: "failed" }), true)
        .isFailed,
    ).toBe(true);
  });

  it("treats undefined payment_required as payable (default true)", () => {
    const s = resolvePaymentState("pending", undefined, undefined);
    expect(s.showPayNow).toBe(true);
  });
});
