import { describe, it, expect } from "vitest";
import { getOrderActions } from "./orderActions";

describe("getOrderActions", () => {
  it("offers 'Confirm payment' for a pending order", () => {
    const a = getOrderActions("pending");
    expect(a.map((x) => x.key)).toEqual(["confirm_payment", "cancel"]);
    expect(a.find((x) => x.key === "confirm_payment")?.apiPath("o1")).toBe(
      "/orders/o1/approve",
    );
  });

  it("offers 'Confirm payment' for an awaiting_approval order", () => {
    const a = getOrderActions("awaiting_approval");
    expect(a.map((x) => x.key)).toEqual(["confirm_payment"]);
  });

  it("offers 'Accept order' (no confirm) for a paid order", () => {
    const a = getOrderActions("paid");
    expect(a.map((x) => x.key)).toEqual(["accept", "cancel_refund"]);
    const accept = a.find((x) => x.key === "accept")!;
    expect(accept.confirm).toBeUndefined();
    expect(accept.apiPath("o1")).toBe("/orders/o1/accept");
    const refund = a.find((x) => x.key === "cancel_refund")!;
    expect(refund.tone).toBe("danger");
  });

  it("offers 'Mark shipped' for an accepted order", () => {
    const a = getOrderActions("accepted");
    expect(a.map((x) => x.key)).toEqual(["ship", "cancel_refund"]);
    expect(a.find((x) => x.key === "ship")?.apiPath("o1")).toBe("/orders/o1/ship");
  });

  it("returns no actions for terminal statuses", () => {
    expect(getOrderActions("fulfilled")).toEqual([]);
    expect(getOrderActions("cancelled")).toEqual([]);
    expect(getOrderActions("refunded")).toEqual([]);
    expect(getOrderActions("shipped")).toEqual([]);
  });

  it("marks destructive actions with a confirmation prompt", () => {
    const a = getOrderActions("pending");
    expect(a.find((x) => x.key === "cancel")?.confirm).toBeTruthy();
    expect(a.find((x) => x.key === "cancel")?.tone).toBe("danger");
  });
});
