export interface Price {
  amount: number;
  currency: string;
}

/** Allowlisted component names — mirrors Agent/schemas/components.py ComponentName. */
export type ComponentName =
  | "ProductGrid"
  | "ProductCard"
  | "ProductDetail"
  | "CategoryList"
  | "VariantSelector"
  | "CartSummary"
  | "ConfirmationDialog"
  | "PaymentCapturePanel"
  | "OrderConfirmation"
  | "OrderList"
  | "OrderDetail"
  | "MerchantBalanceCard"
  | "LedgerTable"
  | "MerchantProfile"
  | "FulfillmentTracker"
  | "SignInPrompt"
  | "ErrorMessage";

/** The directive envelope the agent sends to the frontend (UIDirective). */
export interface UiDirective {
  type: "ui_directive";
  version: number;
  component: ComponentName;
  props: Record<string, unknown>;
  correlation_id: string;
}

/** A message on the agent canvas: plain text and/or a rendered directive. */
export interface CanvasMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  directive?: UiDirective;
  timestamp: Date;
}
