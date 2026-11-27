import type { Product as ApiProduct } from "@/lib/api/client";
import type { CartItem } from "./CartSummary";

export function repriceCart(
  items: CartItem[],
  products: ApiProduct[],
  fallbackCurrency = "NGN",
) {
  const productsById = new Map(products.map((product) => [product.id, product]));
  let currency: string | null = null;
  let subtotal = 0;

  const freshItems = items.map((item) => {
    const product = productsById.get(item.product_id);
    if (!product || product.status !== "active") {
      throw new Error(`Product "${item.product_name}" is no longer available.`);
    }

    const variant = product.variants.find((candidate) => candidate.id === item.variant_id);
    if (!variant) {
      throw new Error(`A current variant for "${product.title}" could not be found.`);
    }

    const amount = variant.price_override_amount ?? product.base_price_amount;
    const itemCurrency = (variant.price_override_currency ?? product.base_price_currency).trim().toUpperCase();
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error(`"${product.title}" does not have a valid current price.`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error(`"${product.title}" has an invalid cart quantity.`);
    }
    if (itemCurrency.length !== 3 || (currency && currency !== itemCurrency)) {
      throw new Error("Cart items must use one valid currency. Check out mixed currencies separately.");
    }

    currency = itemCurrency;
    const lineAmount = amount * item.quantity;
    if (!Number.isSafeInteger(lineAmount)) {
      throw new Error(`The total for "${product.title}" is too large.`);
    }
    subtotal += lineAmount;

    const variantName = Object.entries(variant.attributes ?? {})
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(", ");

    return {
      ...item,
      product_name: product.title,
      variant_name: variantName || item.variant_name,
      sku: variant.sku,
      quantity_available: variant.quantity_available,
      unit_price: { amount, currency: itemCurrency },
      line_total: { amount: lineAmount, currency: itemCurrency },
    };
  });

  if (!Number.isSafeInteger(subtotal)) {
    throw new Error("The cart subtotal is too large.");
  }

  const resolvedCurrency = currency ?? fallbackCurrency;
  return {
    items: freshItems,
    subtotal: { amount: subtotal, currency: resolvedCurrency },
    item_count: freshItems.reduce((count, item) => count + item.quantity, 0),
    currency: resolvedCurrency,
    is_empty: freshItems.length === 0,
  };
}
