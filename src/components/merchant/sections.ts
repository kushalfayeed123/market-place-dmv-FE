import { Package, ShoppingBag, Truck, Wallet, ShieldAlert, MessageSquare, LayoutDashboard } from "lucide-react";

export type CellKind = "text" | "money" | "date" | "badge";
export interface Column { key: string; label: string; kind?: CellKind; align?: "right" }
export interface RowAction {
  label: string; method: "POST" | "PATCH" | "DELETE"; path: (row: any) => string;
  body?: (row: any) => unknown; when?: (row: any) => boolean;
  confirm?: string;            // shown in a confirm step; use for money/irreversible actions
  tone?: "danger";
}
export interface SectionConfig {
  key: string; label: string; icon: any; hint: string;
  list?: (mid: string, q: { search: string; status: string }) => string;
  statuses?: string[]; columns?: Column[]; actions?: RowAction[]; emptyText?: string;
  primary?: { label: string; href?: string };
}
const qs = (q: { search: string; status: string }) =>
  `?${new URLSearchParams({ ...(q.search && { search: q.search }), ...(q.status && { status: q.status }) })}`;

export const SECTIONS: SectionConfig[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, hint: "Today at a glance" },
  { key: "orders", label: "Orders", icon: ShoppingBag, hint: "Fulfil and track customer orders",
    list: (m, q) => `/merchants/${m}/orders${qs(q)}`,
    statuses: ["paid", "processing", "shipped", "delivered", "cancelled"],
    columns: [{ key: "number", label: "Order" }, { key: "customer_name", label: "Customer" }, { key: "created_at", label: "Placed", kind: "date" },
      { key: "total", label: "Total", kind: "money", align: "right" }, { key: "status", label: "Status", kind: "badge" }],
    actions: [
      { label: "Accept", method: "POST", path: r => `/orders/${r.id}/accept`, when: r => r.status === "paid" },
      { label: "Mark shipped", method: "POST", path: r => `/orders/${r.id}/ship`, when: r => r.status === "processing" },
      { label: "Cancel & refund", method: "POST", path: r => `/orders/${r.id}/cancel`, when: r => ["paid", "processing"].includes(r.status), confirm: "Cancel this order and refund the buyer?", tone: "danger" },
    ], emptyText: "No orders yet. They'll appear here as soon as a buyer pays." },
  { key: "products", label: "Products", icon: Package, hint: "Your catalogue and stock",
    list: (m, q) => `/merchants/${m}/products${qs(q)}`, statuses: ["active", "draft", "out_of_stock"],
    columns: [{ key: "title", label: "Product" }, { key: "sku", label: "SKU" }, { key: "stock", label: "In stock" },
      { key: "price", label: "Price", kind: "money", align: "right" }, { key: "status", label: "Status", kind: "badge" }],
    actions: [
      { label: "Publish", method: "POST", path: r => `/products/${r.id}/publish`, when: r => r.status === "draft" },
      { label: "Unpublish", method: "POST", path: r => `/products/${r.id}/unpublish`, when: r => r.status === "active" },
      { label: "Delete", method: "DELETE", path: r => `/products/${r.id}`, confirm: "Delete this product permanently?", tone: "danger" },
    ], primary: { label: "Add product", href: "/merchant/products/new" }, emptyText: "Add your first product to start selling." },
  { key: "delivery", label: "Delivery", icon: Truck, hint: "Shipments and couriers",
    list: (m, q) => `/merchants/${m}/shipments${qs(q)}`, statuses: ["pending", "in_transit", "delivered", "failed"],
    columns: [{ key: "order_number", label: "Order" }, { key: "courier", label: "Courier" }, { key: "tracking_code", label: "Tracking" },
      { key: "updated_at", label: "Updated", kind: "date" }, { key: "status", label: "Status", kind: "badge" }],
    actions: [{ label: "Request pickup", method: "POST", path: r => `/shipments/${r.id}/pickup`, when: r => r.status === "pending" },
      { label: "Mark delivered", method: "POST", path: r => `/shipments/${r.id}/delivered`, when: r => r.status === "in_transit" }],
    emptyText: "No shipments. Mark an order as shipped to create one." },
  { key: "payments", label: "Payments", icon: Wallet, hint: "Payouts and bank accounts",
    list: (m, q) => `/merchants/${m}/payouts${qs(q)}`, statuses: ["requested", "processing", "paid", "failed"],
    columns: [{ key: "reference", label: "Reference" }, { key: "bank_account", label: "To" }, { key: "created_at", label: "Requested", kind: "date" },
      { key: "amount", label: "Amount", kind: "money", align: "right" }, { key: "status", label: "Status", kind: "badge" }],
    actions: [{ label: "Cancel request", method: "POST", path: r => `/payouts/${r.id}/cancel`, when: r => r.status === "requested", confirm: "Cancel this payout request?" }],
    emptyText: "No payouts yet. Request one from your available balance." },
  { key: "disputes", label: "Disputes", icon: ShieldAlert, hint: "Respond before the deadline",
    list: (m, q) => `/merchants/${m}/disputes${qs(q)}`, statuses: ["open", "evidence_submitted", "won", "lost"],
    columns: [{ key: "order_number", label: "Order" }, { key: "reason", label: "Reason" }, { key: "respond_by", label: "Respond by", kind: "date" },
      { key: "amount", label: "Amount", kind: "money", align: "right" }, { key: "status", label: "Status", kind: "badge" }],
    actions: [
      { label: "Accept & refund", method: "POST", path: r => `/disputes/${r.id}/accept`, when: r => r.status === "open", confirm: "Accept this dispute? The buyer is refunded and this can't be undone.", tone: "danger" },
      { label: "Submit evidence", method: "POST", path: r => `/disputes/${r.id}/evidence`, when: r => r.status === "open" }],
    emptyText: "No disputes. Nice work." },
  { key: "messages", label: "Messages", icon: MessageSquare, hint: "Customer conversations",
    list: (m, q) => `/merchants/${m}/conversations${qs(q)}`, statuses: ["unread", "open", "resolved"],
    columns: [{ key: "customer_name", label: "Customer" }, { key: "last_message", label: "Latest message" },
      { key: "updated_at", label: "When", kind: "date" }, { key: "status", label: "Status", kind: "badge" }],
    actions: [{ label: "Mark resolved", method: "POST", path: r => `/conversations/${r.id}/resolve`, when: r => r.status !== "resolved" }],
    emptyText: "No customer messages." },
];
