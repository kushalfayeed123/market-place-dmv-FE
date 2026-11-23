import { describe, expect, it } from "vitest";
import {
  aggregateFulfillmentStatus,
  isBlockedStatus,
  isTrackableStatus,
  trackerStepIndex,
} from "./fulfillmentTrackerUtils";

describe("trackerStepIndex", () => {
  it("maps fulfillment statuses to the correct step", () => {
    expect(trackerStepIndex("delivered")).toBe(4);
    expect(trackerStepIndex("delivered_digital")).toBe(4);
    expect(trackerStepIndex("fulfilled")).toBe(4);
    expect(trackerStepIndex("out_for_delivery")).toBe(3);
    expect(trackerStepIndex("in_transit")).toBe(2);
    expect(trackerStepIndex("shipped")).toBe(2);
    expect(trackerStepIndex("packed")).toBe(1);
    expect(trackerStepIndex("processing")).toBe(1);
    expect(trackerStepIndex("partially_fulfilled")).toBe(1);
    expect(trackerStepIndex("pending")).toBe(0);
    expect(trackerStepIndex("paid")).toBe(0);
    expect(trackerStepIndex("accepted")).toBe(0);
    expect(trackerStepIndex("awaiting_approval")).toBe(0);
    expect(trackerStepIndex("anything-else")).toBe(0);
    expect(trackerStepIndex(null)).toBe(0);
  });
});

describe("isBlockedStatus / isTrackableStatus", () => {
  it("flags cancelled/refunded/failed as blocked", () => {
    for (const s of ["cancelled", "refunded", "failed"]) {
      expect(isBlockedStatus(s)).toBe(true);
      expect(isTrackableStatus(s)).toBe(false);
    }
  });

  it("treats everything else as trackable", () => {
    for (const s of ["pending", "paid", "shipped", "delivered", "weird"]) {
      expect(isBlockedStatus(s)).toBe(false);
      expect(isTrackableStatus(s)).toBe(true);
    }
  });
});

describe("aggregateFulfillmentStatus", () => {
  it("takes the most progressed fulfillment status", () => {
    expect(aggregateFulfillmentStatus(["pending", "shipped", "delivered"])).toBe("delivered");
    expect(aggregateFulfillmentStatus(["pending", "shipped"])).toBe("shipped");
    expect(aggregateFulfillmentStatus(["pending"])).toBe("pending");
  });

  it("surfaces failed when nothing has shipped yet", () => {
    expect(aggregateFulfillmentStatus(["pending", "failed"])).toBe("failed");
  });

  it("defaults to pending for empty input", () => {
    expect(aggregateFulfillmentStatus([])).toBe("pending");
    expect(aggregateFulfillmentStatus([null, undefined])).toBe("pending");
  });
});
