import { describe, expect, it } from "vitest";
import type { Product as BackendProduct } from "@/lib/api/client";
import {
  CATALOG_PRODUCT_SECTIONS,
  groupCatalogProducts,
  toUiProduct,
} from "./catalogProductUtils";

function backendProduct(
  overrides: Partial<BackendProduct> = {},
): BackendProduct {
  return {
    id: "product-id",
    title: "Test product",
    slug: "test-product",
    description: null,
    merchant_id: "merchant-id",
    store_id: "store-id",
    category_id: null,
    fulfillment_type: "physical",
    product_types: ["physical"],
    digital_file_url: null,
    status: "active",
    base_price_amount: 1000,
    base_price_currency: "NGN",
    attributes: {},
    variants: [],
    urls: [],
    ...overrides,
  };
}

describe("catalog product type sections", () => {
  it("places the digital products section first", () => {
    expect(CATALOG_PRODUCT_SECTIONS[0]).toEqual({
      type: "digital",
      title: "Digital products",
    });
  });

  it("preserves backend product types when creating storefront products", () => {
    const product = toUiProduct(backendProduct({
      fulfillment_type: "digital",
      product_types: ["digital"],
    }));

    expect(product.product_types).toEqual(["digital"]);
  });

  it("keeps digital products out of the physical section", () => {
    const physical = toUiProduct(backendProduct());
    const digital = toUiProduct(backendProduct({
      id: "digital-id",
      fulfillment_type: "digital",
      product_types: ["digital"],
    }));
    const groups = groupCatalogProducts([physical, digital]);

    expect(groups.physical.map((product) => product.id)).toEqual(["product-id"]);
    expect(groups.digital.map((product) => product.id)).toEqual(["digital-id"]);
  });

  it("uses digital fulfillment when backend product type fields conflict", () => {
    const digital = toUiProduct(backendProduct({
      fulfillment_type: "digital",
      product_types: ["physical"],
    }));
    const groups = groupCatalogProducts([digital]);

    expect(groups.physical).toHaveLength(0);
    expect(groups.digital.map((product) => product.id)).toEqual(["product-id"]);
  });

  it("falls back to fulfillment type when product_types are absent", () => {
    const digital = toUiProduct(backendProduct({
      fulfillment_type: "digital",
      product_types: undefined,
    }));
    const groups = groupCatalogProducts([digital]);

    expect(digital.product_types).toEqual(["digital"]);
    expect(groups.digital.map((product) => product.id)).toEqual(["product-id"]);
  });
});
