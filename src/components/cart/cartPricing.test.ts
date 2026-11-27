import { describe, expect, it } from "vitest";
import type { Product } from "@/lib/api/client";
import type { CartItem } from "./CartSummary";
import { repriceCart } from "./cartPricing";

const product: Product = {
  id: "product-1",
  title: "Current Product Name",
  slug: "product",
  description: null,
  merchant_id: "merchant-1",
  store_id: "store-1",
  category_id: null,
  fulfillment_type: "physical",
  status: "active",
  base_price_amount: 2500,
  base_price_currency: "NGN",
  attributes: {},
  variants: [
    {
      id: "variant-1",
      product_id: "product-1",
      sku: "SKU-1",
      attributes: { color: "Blue" },
      price_override_amount: 3000,
      price_override_currency: "NGN",
      inventory_policy: "tracked",
      quantity_available: 4,
      created_at: "",
      updated_at: "",
    },
  ],
};

const staleItem: CartItem = {
  variant_id: "variant-1",
  product_id: "product-1",
  product_name: "Old Product Name",
  variant_name: "Old variant",
  sku: "OLD-SKU",
  quantity: 2,
  unit_price: { amount: 1000, currency: "NGN" },
  line_total: { amount: 2000, currency: "NGN" },
};

describe("repriceCart", () => {
  it("uses the current product and variant price instead of the cached cart amount", () => {
    const cart = repriceCart([staleItem], [product]);

    expect(cart.items[0]).toMatchObject({
      product_name: "Current Product Name",
      variant_name: "color: Blue",
      sku: "SKU-1",
      quantity_available: 4,
      unit_price: { amount: 3000, currency: "NGN" },
      line_total: { amount: 6000, currency: "NGN" },
    });
    expect(cart.subtotal).toEqual({ amount: 6000, currency: "NGN" });
  });

  it("rejects a zero current price rather than falling back to a cached value", () => {
    const zeroPriceProduct = {
      ...product,
      variants: [{ ...product.variants[0], price_override_amount: 0 }],
    };

    expect(() => repriceCart([staleItem], [zeroPriceProduct])).toThrow(
      "does not have a valid current price",
    );
  });
});
