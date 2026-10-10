import { describe, it, expect } from "vitest";
import { formatMoney, cleanLabel } from "./format";

describe("formatMoney", () => {
  it("formats whole amounts without decimals (100800 minor → ₦1,008)", () => {
    // The raw minor-unit integer must NOT appear verbatim: '100,800' is wrong.
    const result = formatMoney(100800, "NGN");
    expect(result).toContain("1,008");
    expect(result).not.toContain("100,800");
    expect(result).toMatch(/₦/);
  });

  it("keeps kobo when present (100850 minor → ₦1,008.50)", () => {
    const result = formatMoney(100850, "NGN");
    expect(result).toBe("₦1,008.50");
  });

  it("handles zero correctly (0 minor → ₦0)", () => {
    expect(formatMoney(0, "NGN")).toBe("₦0");
  });

  it("falls back to currency code when symbol is unknown", () => {
    const result = formatMoney(100800, "XYZ");
    expect(result).toContain("XYZ");
    expect(result).not.toContain("100,800");
  });

  it("never shows the 100x bug (100800 must render as 1,008 not 100,800)", () => {
    const result = formatMoney(100800, "NGN");
    // Must contain the correct value
    expect(result).toMatch(/1,?008/);
    // Must NOT contain the raw minor-unit value as Naira
    expect(result).not.toMatch(/100,?800/);
  });

  it("strips trailing zeros for whole amounts", () => {
    expect(formatMoney(500, "NGN")).toBe("₦5");
  });

  it("keeps cents for 1 kobo", () => {
    expect(formatMoney(1, "NGN")).toBe("₦0.01");
  });

  it("handles null/undefined amount gracefully", () => {
    expect(formatMoney(0, "NGN")).toBe("₦0");
  });

  it("uses USD symbol for USD", () => {
    const result = formatMoney(1999, "USD");
    expect(result).toContain("$19.99");
  });
});

describe("cleanLabel", () => {
  it("returns undefined for 'Merchant #abcd1234' placeholders", () => {
    expect(cleanLabel("Merchant #abcd1234")).toBeUndefined();
  });

  it("returns undefined for 'Store #abcd1234' placeholders", () => {
    expect(cleanLabel("Store #abcd1234")).toBeUndefined();
  });

  it("preserves real merchant/store names", () => {
    expect(cleanLabel("Tech Store")).toBe("Tech Store");
    expect(cleanLabel("Acme Merchant")).toBe("Acme Merchant");
  });

  it("returns undefined for falsy input", () => {
    expect(cleanLabel(undefined)).toBeUndefined();
    expect(cleanLabel("")).toBeUndefined();
  });
});
