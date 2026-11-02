import type { Product } from "./api/client";

export type CheckoutFulfillment = "delivery" | "digital" | "service";

export function resolveCheckoutFulfillment(
  products: Pick<Product, "fulfillment_type" | "product_types">[],
): CheckoutFulfillment {
  const types = products.flatMap((product) => product.product_types ?? []);
  if (products.some((product) => product.fulfillment_type === "physical") || types.includes("physical")) {
    return "delivery";
  }
  if (products.some((product) => product.fulfillment_type === "digital") || types.includes("digital")) {
    return "digital";
  }
  return "service";
}
