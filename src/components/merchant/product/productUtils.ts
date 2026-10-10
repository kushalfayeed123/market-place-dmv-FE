export const MINOR_UNITS_PER_MAJOR = 100; /* NGN: 1 Naira = 100 kobo */
export const MAX_IMAGES = 8;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const LOW_STOCK_AT = 5;

export type InventoryPolicy = "tracked" | "untracked" | "unlimited";
export type Fulfillment = "physical" | "digital" | "service";

export const toMinorUnits = (major: number) => Math.round(major * MINOR_UNITS_PER_MAJOR);
export const fromMinorUnits = (minor: number) => minor / MINOR_UNITS_PER_MAJOR;

export function slugify(title: string): string {
  return title
    ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "product"
    : "";
}

export function generateSku(title: string): string {
  const cleaned = title ? title.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 4) : "";
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const ts = Date.now().toString(36).slice(-4).toUpperCase();
  return `${cleaned}-${ts}-${rand}`.replace(/^-+|-+$/g, "") || `SKU-${rand}`;
}

export function currencySymbol(currency: string): string {
  try {
    return (
      new Intl.NumberFormat("en", { style: "currency", currency })
        .formatToParts(0)
        .find((p) => p.type === "currency")?.value ?? currency
    );
  } catch {
    return currency;
  }
}

/** Normalised view of an API variant, so UI code never trips on missing/null fields. */
export interface VariantView {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  inventory_policy: InventoryPolicy;
  quantity_available: number | null;
  quantity_reserved: number;
  price_override_amount: number | null;
  price_override_currency: string | null;
}

export function toVariantView(v: unknown): VariantView {
  const r = v as Record<string, unknown>;
  return {
    id: String(r.id),
    sku: String(r.sku ?? ""),
    attributes: (r.attributes as Record<string, string> | null) ?? {},
    inventory_policy: (r.inventory_policy as InventoryPolicy) ?? "tracked",
    quantity_available: (r.quantity_available as number | null) ?? null,
    quantity_reserved: Number(r.quantity_reserved ?? 0),
    price_override_amount: (r.price_override_amount as number | null) ?? null,
    price_override_currency: (r.price_override_currency as string | null) ?? null,
  };
}

export type StockState = "unlimited" | "untracked" | "out" | "low" | "in";

export function stockState(v: Pick<VariantView, "inventory_policy" | "quantity_available">): StockState {
  if (v.inventory_policy === "unlimited") return "unlimited";
  if (v.inventory_policy === "untracked") return "untracked";
  const q = v.quantity_available ?? 0;
  return q <= 0 ? "out" : q <= LOW_STOCK_AT ? "low" : "in";
}

export const isSellable = (v: VariantView) => stockState(v) !== "out";

export interface ReadinessItem {
  key: string;
  label: string;
  hint: string;
  ok: boolean;
  required: boolean;
}

/** What a product needs before it can be listed on the marketplace. */
export function getReadiness(i: {
  title: string;
  price: number;
  categoryId: string;
  description: string;
  imageCount: number;
  fulfillment: Fulfillment;
  hasVariant: boolean;
  hasSellableStock: boolean;
}): { items: ReadinessItem[]; ready: boolean; missing: ReadinessItem[] } {
  const items: ReadinessItem[] = [
    { key: "title", label: "Title", hint: "Add a product title.", ok: i.title.trim().length > 0, required: true },
    { key: "price", label: "Price above zero", hint: "Set a price customers will pay.", ok: i.price > 0, required: true },
    { key: "category", label: "Category", hint: "Pick a category so shoppers can find it.", ok: !!i.categoryId, required: true },
    { key: "photo", label: "At least one photo", hint: "Add a cover photo.", ok: i.imageCount > 0, required: true },
  ];
  if (i.fulfillment === "physical") {
    items.push({
      key: "stock",
      label: "Stock available",
      hint: i.hasVariant ? "Set stock above zero, or stop counting units." : "Add a variant with stock.",
      ok: i.hasVariant && i.hasSellableStock,
      required: true,
    });
  }
  items.push({
    key: "description",
    label: "Description (20+ characters)",
    hint: "Descriptions help shoppers and the search agent match your product.",
    ok: i.description.trim().length >= 20,
    required: false,
  });
  const missing = items.filter((x) => x.required && !x.ok);
  return { items, ready: missing.length === 0, missing };
}
