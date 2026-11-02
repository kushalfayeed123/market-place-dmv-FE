import type { Product } from "./ProductCard";
import type { Product as BackendProduct } from "@/lib/api/client";

export type CatalogProduct = Product & {
  description?: string;
  store_name?: string;
  store_id?: string;
  fulfillment_type: CatalogProductType;
};

export type CatalogProductType = "physical" | "digital" | "service";

export const CATALOG_PRODUCT_SECTIONS: Array<{
  type: CatalogProductType;
  title: string;
}> = [
  { type: "digital", title: "Digital products" },
  { type: "physical", title: "Physical products" },
  { type: "service", title: "Services" },
];

const PRODUCT_TYPES = new Set<CatalogProductType>(["physical", "digital", "service"]);

function isCatalogProductType(value: string): value is CatalogProductType {
  return PRODUCT_TYPES.has(value as CatalogProductType);
}

export function toUiProduct(product: BackendProduct): CatalogProduct {
  const productTypes = (product.product_types ?? []).filter(isCatalogProductType);
  const fulfillmentType = isCatalogProductType(product.fulfillment_type)
    ? product.fulfillment_type
    : undefined;

  return {
    id: product.id,
    name: product.title,
    merchant_id: product.merchant_id,
    merchant_name: `Merchant #${product.merchant_id.slice(0, 8)}`,
    store_name: `Store #${product.store_id.slice(0, 8)}`,
    store_id: product.store_id,
    fulfillment_type: fulfillmentType ?? productTypes[0] ?? "physical",
    price: { amount: product.base_price_amount, currency: product.base_price_currency },
    status: product.status,
    description: product.description ?? undefined,
    product_types: productTypes.length ? productTypes : [fulfillmentType ?? "physical"],
    urls: product.urls?.length ? product.urls : undefined,
    image_url: product.urls?.[0] ?? undefined,
  };
}

export function groupCatalogProducts(products: CatalogProduct[]) {
  const groups: Record<CatalogProductType, CatalogProduct[]> = {
    physical: [],
    digital: [],
    service: [],
  };

  for (const product of products) {
    const types = product.product_types ?? [];
    const effectiveType: CatalogProductType =
      product.fulfillment_type === "digital" || types.includes("digital")
      ? "digital"
      : product.fulfillment_type === "physical" || types.includes("physical")
        ? "physical"
        : product.fulfillment_type === "service" || types.includes("service")
          ? "service"
          : "physical";
    groups[effectiveType].push(product);
  }

  return groups;
}
