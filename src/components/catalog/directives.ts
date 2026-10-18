import type { Product } from "./ProductCard";

export type SortKey = "relevance" | "price_asc" | "price_desc" | "rating";

/** Per-product add-to-cart feedback. Missing key = idle. */
export type CartState = Record<string, "adding" | "added">;

/**
 * Optional props the agent MAY add to a ProductGrid ui_directive.
 * Everything beyond items/products/query is optional, so the current
 * backend keeps working unchanged.
 */
export interface ProductGridDirectiveProps {
  items?: unknown[];
  products?: unknown[];
  query?: string;
  /** One-line take from the agent, shown above the results. */
  summary?: string;
  /** Initial sort / category filter chosen by the agent. */
  sort?: SortKey;
  category?: string;
  /** Follow-up prompts rendered as chips; clicking sends them to the agent. */
  suggestions?: string[];
  /** product id -> short badge text, e.g. { "p1": "Best match", "p2": "Cheapest" }. */
  highlights?: Record<string, string>;
}

export interface ProductDetailExtras {
  description?: string;
  specs?: { label: string; value: string }[];
  /** The agent's take on this product (callout above the description). */
  agent_note?: string;
  /** Only shown when provided; no hardcoded shipping promises. */
  shipping_note?: string;
  suggestions?: string[];
}

export type ProductDetailDirectiveProps = Product &
  ProductDetailExtras & { related?: unknown[] };

/** Payment method selection directive — rendered when asking the buyer how to pay. */
export interface PaymentSelectionDirectiveProps {
  /** Available payment methods. */
  methods: Array<{
    key: "paystack" | "pay_on_delivery";
    label: string;
    description: string;
  }>;
  /** Currently selected method key. */
  selected?: string;
  /** Fired when the buyer picks a method. */
  onSelect: (method: string) => void;
  /**
   * Order the selection applies to. When present the frontend can render the
   * "Proceed to Paystack" / "Confirm Pay on Delivery" CTAs and dispatch
   * process_payment for this order; when absent only method selection renders.
   */
  order_id?: string;
}

/** Order success / close-out directive — rendered after purchase completes. */
export interface OrderSuccessDirectiveProps {
  order: {
    id: string;
    order_number: string;
    status: string;
    total: { amount: number; currency: string };
    merchant_name: string;
    items?: {
      product_name: string;
      quantity: number;
      unit_price: { amount: number; currency: string };
    }[];
  };
  /** Shown when true; clicking closes the checkout session. */
  onClose: () => void;
  /** Whether to show the fulfillment tracker. */
  showTracker?: boolean;
}
