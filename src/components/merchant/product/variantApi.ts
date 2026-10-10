import { apiClient } from "@/lib/api/client";
import { toVariantView, type InventoryPolicy, type VariantView } from "./productUtils";

export interface VariantPatch {
  sku?: string;
  quantity_available?: number;
  inventory_policy?: InventoryPolicy;
  price_override_amount?: number | null;
  price_override_currency?: string | null;
}

/**
 * ASSUMPTION - the one line to check: this expects
 *   apiClient.updateProductVariant(productId, variantId, patch)
 * to exist and call  PATCH /products/{productId}/variants/{variantId}
 * returning the updated variant. If it does not, add it to lib/api/client.ts
 * (and the backend route) - nothing else in the UI needs to change.
 */
export async function updateVariant(
  productId: string,
  variantId: string,
  patch: VariantPatch,
): Promise<VariantView> {
  return toVariantView(await apiClient.updateProductVariant(productId, variantId, patch));
}

export async function addVariant(
  productId: string,
  input: {
    sku: string;
    attributes: Record<string, string>;
    quantity_available: number;
    inventory_policy: InventoryPolicy;
  },
): Promise<VariantView> {
  return toVariantView(
    await apiClient.createProductVariant(productId, {
      sku: input.sku,
      attributes: input.attributes,
      price_override_amount: null,
      price_override_currency: null,
      inventory_policy: input.inventory_policy,
      quantity_available: input.quantity_available,
      quantity_reserved: 0,
    }),
  );
}
