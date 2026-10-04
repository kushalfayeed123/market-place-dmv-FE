"use client";

import { useState, useRef, useEffect, useId } from "react";
import {
  Send, ShoppingBag, LayoutGrid, Package, Store, Zap, ChevronRight,
  LayoutDashboard, MessageSquare, ArrowLeftRight, Wifi, WifiOff, Sparkles,
  X, Menu, Search as SearchIcon, User as UserIcon, LogOut
} from "lucide-react";
import { useAuth } from "./context/AuthContext";

import { ProductGrid } from "./components/catalog/ProductGrid";
import { ProductDetail } from "./components/catalog/ProductDetail";
import { CartSummary } from "./components/cart/CartSummary";
import { OrderList } from "./components/orders/OrderList";
import { OrderConfirmation } from "./components/orders/OrderConfirmation";
import { MerchantBalanceCard } from "./components/merchant/MerchantBalanceCard";
import { LedgerTable } from "./components/merchant/LedgerTable";
import { FulfillmentTracker } from "./components/fulfillment/FulfillmentTracker";
import { ConfirmationDialog } from "./components/system/ConfirmationDialog";
import { SignInPrompt } from "./components/system/SignInPrompt";
import { ErrorMessage } from "./components/system/ErrorMessage";

import { type CanvasMessage, type UiDirective } from "./types/components";
import type { Product } from "./components/catalog/ProductCard";
import type { Order } from "./components/orders/OrderList";
import type { LedgerEntry } from "./components/merchant/LedgerTable";
import type { CartSummaryProps } from "./components/cart/CartSummary";
import type { ComponentProps } from "react";
import { apiClient } from "./lib/api/client";
import type { Product as BackendProduct, Order as BackendOrder } from "./lib/api/client";
import { agentGateway } from "./lib/agent-gateway";
import { LandingPage } from "./components/landing/LandingPage";

// ────────────────────────────────────────────────────────────
// Backend → UI view-model mappers (classic view)
// ────────────────────────────────────────────────────────────

type CatalogProduct = Product & {
  // View-model extensions the catalog UI needs but the backend Product
  // endpoint does not currently return (see todo below).
  description?: string;
  merchant_name?: string;
  store_name?: string;
  store_id?: string;
};

/**
 * Maps the backend Product (from client.ts) into the catalog view model.
 *
 * TODO (merchant/store name): the backend /api/v1/catalog/products endpoint
 * returns merchant_id and store_id but NOT the merchant business_name or
 * store name. Two options to get real names into the UI:
 *   A) Enhance the backend catalog endpoint to join store.name into the
 *      ProductResponse (preferred — cheapest, one request, no auth concern
 *      for anonymous browsing).
 *   B) Add getStoreName(store_id) / getMerchantName(merchant_id) to the API
 *      client and call them per product in the catalog (N extra requests;
 *      both endpoints require auth, so anonymous catalog browsing may need
 *      a different approach).
 * Until one of those is in place, merchant_name/store_name are set to a
 * clearly-labeled placeholder so the gap is visible in QA rather than hidden
 * behind a silent lookup. Remove these placeholders once option A or B lands.
 */
function toUiProduct(p: BackendProduct): CatalogProduct {
  return {
    id: p.id,
    name: p.title,
    merchant_id: p.merchant_id,
    store_id: p.store_id,
    merchant_name:
      `Merchant #${p.merchant_id.slice(0, 8)}` as CatalogProduct["merchant_name"],
    store_name:
      `Store #${p.store_id.slice(0, 8)}` as CatalogProduct["store_name"],
    price: { amount: p.base_price_amount, currency: p.base_price_currency },
    status: p.status,
    description: p.description ?? undefined,
  };
}

function toUiOrder(o: BackendOrder): Order {
  return {
    id: o.id,
    order_number: o.id,
    status: o.status,
    created_at: o.created_at,
    total: { amount: o.total_amount, currency: o.currency },
    items_count: o.items.length,
    merchant_name:
      (o.items[0]?.merchant_id as string | undefined) ?? "Marketplace",
  };
}

// ────────────────────────────────────────────────────────────
// Classic View
// ────────────────────────────────────────────────────────────

function ClassicCatalog() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    apiClient
      .getProducts()
      .then((data) => {
        setProducts(data.map(toUiProduct));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err);
        setLoading(false);
      });
  }, []);

  const filtered = searchQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.merchant_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : products;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-[var(--font-display)] text-2xl font-semibold">
          Browse Products
        </h2>
      </div>

      {/* Search bar */}
      <div className="relative mb-4 max-w-md">
        <SearchIcon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search products, merchants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-all"
        />
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : selected ? (
        <ProductDetail product={selected} onBack={() => setSelected(null)} />
      ) : (
        <ProductGrid
          products={filtered}
          query={searchQuery || undefined}
          onView={(p) => setSelected(p)}
        />
      )}
    </div>
  );
}

function ClassicOrders() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
    const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient
      .getOrders()
      .then((data) => {
        setOrders(data.map(toUiOrder));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch orders:", err);
        setLoading(false);
      });
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <h2 className="font-[var(--font-display)] text-2xl font-semibold mb-5">My Orders</h2>
        <div className="text-center py-10 text-[var(--color-muted)]">
          <LogOut size={48} className="mx-auto mb-4 text-gray-200" />
          <h3 className="font-semibold mb-2">Sign in to view your orders</h3>
          <p className="text-sm mb-4">You need an account to view your order history.</p>
          <button
            onClick={() => (window.location.href = "/auth")}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="font-[var(--font-display)] text-2xl font-semibold mb-5">My Orders</h2>
      {loading || authLoading ? (
        <p>Loading orders...</p>
      ) : (
        <div>
          {selected ? (
            <div>
              <button onClick={() => setSelected(null)} className="text-sm text-[var(--color-primary)] mb-4 flex items-center gap-1 hover:underline">
                ← Back to orders
              </button>
              <FulfillmentTracker order={selected} />
            </div>
          ) : (
            <OrderList
              orders={orders}
              onTrack={(o) => setSelected(o)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Directive Renderer
// ────────────────────────────────────────────────────────────

function DirectiveView({ directive, onAction }: { directive: UiDirective; onAction?: (action: string, data?: unknown) => void }) {
  if (directive.component === "ProductGrid") {
        return (
      <ProductGrid
        products={directive.props.products as Product[]}
        query={directive.props.query as string | undefined}
        onView={(p) => onAction?.("view_product", p)}
        onAddToCart={(p) => onAction?.("add_to_cart", p)}
      />
    );
  }
  if (directive.component === "ProductDetail") {
    return (
      <ProductDetail
        product={directive.props.product as Product}
        onAddToCart={(p) => onAction?.("add_to_cart", p)}
      />
    );
  }
  if (directive.component === "CartSummary") {
    const props = directive.props as unknown as CartSummaryProps;
    return <CartSummary {...props} onCheckout={() => onAction?.("checkout")} />;
  }
  if (directive.component === "OrderList") {
    return (
      <OrderList
        orders={directive.props.orders as Order[]}
        onTrack={(o) => onAction?.("track_order", o)}
      />
    );
  }
  if (directive.component === "OrderConfirmation") {
    return <OrderConfirmation order={directive.props.order as Order} />;
  }
  if (directive.component === "MerchantBalanceCard") {
    const props = directive.props as unknown as ComponentProps<typeof MerchantBalanceCard>;
    return <MerchantBalanceCard {...props} />;
  }
  if (directive.component === "LedgerTable") {
    return <LedgerTable entries={directive.props.entries as LedgerEntry[]} />;
  }
  if (directive.component === "FulfillmentTracker") {
    return <FulfillmentTracker order={directive.props.order as Order} />;
  }
  if (directive.component === "ConfirmationDialog") {
    const props = directive.props as unknown as ComponentProps<typeof ConfirmationDialog>;
    return (
      <ConfirmationDialog
        {...props}
        onConfirm={() => onAction?.("confirm", directive.props.tool_name)}
        onCancel={() => onAction?.("cancel")}
      />
    );
  }
  if (directive.component === "SignInPrompt") {
    const props = directive.props as unknown as ComponentProps<typeof SignInPrompt>;
    return <SignInPrompt {...props} />;
  }
  if (directive.component === "ErrorMessage") {
    const props = directive.props as unknown as ComponentProps<typeof ErrorMessage>;
    return <ErrorMessage {...props} />;
  }
  return <ErrorMessage message={`Unknown component: ${(directive as { component: string }).component}`} />;
}

// ────────────────────────────────────────────────────────────
// Suggestion chips
// ────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { label: "Show me phones", icon: <Sparkles size={12} /> },
  { label: "View my cart", icon: <ShoppingBag size={12} /> },
  { label: "My recent orders", icon: <Package size={12} /> },
  { label: "My payout balance", icon: <Store size={12} /> },
  { label: "Show ledger history", icon: <LayoutGrid size={12} /> },
  { label: "Track my shipment", icon: <Package size={12} /> },
];

// ────────────────────────────────────────────────────────────
// Main App
// ────────────────────────────────────────────────────────────

type Mode = "agent" | "classic";
type ClassicTab = "catalog" | "orders";

export default function App() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [view, setView] = useState<"landing" | "app">("app");
  const [mode, setMode] = useState<Mode>("classic");
  const [classicTab, setClassicTab] = useState<ClassicTab>("catalog");
  const [messages, setMessages] = useState<CanvasMessage[]>([
    {
      id: "welcome",
      role: "agent",
      content: "Hi! I'm your marketplace assistant. I can help you browse products, manage your cart, track orders, or view your merchant dashboard. What would you like to do?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const canvasEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  // Connect to Agent Gateway on mount
  useEffect(() => {
    // Check if we already have a session
    const storedSession = agentGateway.getStoredSessionId();
    if (storedSession) {
      agentGateway.connect(storedSession);
      setSessionId(storedSession);
      setConnected(true);
    } else {
      // Start a new session - connect without session ID and let the gateway create one
      agentGateway.connect();
      // The gateway will trigger onSession event when a session is established
    }

    // Set up handlers for gateway events
    agentGateway.setHandlers({
      onDirective: (directive: UiDirective) => {
        // Process the directive and add it to messages
        const message: CanvasMessage = {
          id: `${uid}-${messages.length}`,
          role: "agent",
          content: "",
          directive: directive,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, message]);
      },
      onText: (content: string) => {
        pushMessage({ role: "agent", content, timestamp: new Date() });
            },
      onError: (error: string) => {
        console.error("Agent Gateway error:", error);
        setConnected(false);
      },
      onSession: (sessionId: string) => {
        setSessionId(sessionId);
        setConnected(true);
      },
    });

    // Check connection status after a short delay
    const checkConnection = setTimeout(() => {
      setConnected(agentGateway.isConnected());
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearTimeout(checkConnection);
      agentGateway.disconnect();
    };
  }, []);

  function pushMessage(msg: Omit<CanvasMessage, "id">) {
    setMessages((prev) => [...prev, { ...msg, id: `${uid}-${prev.length}` }]);
  }

  async function handleSend(text?: string) {
    const query = (text ?? input).trim();
    if (!query) return;
    setInput("");

      pushMessage({ role: "user", content: query, timestamp: new Date() });
  setIsTyping(true);

  await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

  agentGateway.sendMessage(query);
  setIsTyping(false);
}

  function handleAction(action: string, data?: unknown) {
    if (action === "view_product") {
      const p = data as Product;
      pushMessage({ role: "agent", content: "", directive: { type: "ui_directive", version: 1, component: "ProductDetail", props: { product: p }, correlation_id: `${uid}-${Date.now()}` }, timestamp: new Date() });
    } else if (action === "add_to_cart") {
      const p = data as Product;
      pushMessage({ role: "agent", content: `Added **${p.name}** to your cart.`, timestamp: new Date() });
    } else if (action === "checkout") {
      handleSend("checkout please");
    } else if (action === "confirm") {
      pushMessage({ role: "user", content: "Confirmed", timestamp: new Date() });
    } else if (action === "track_order") {
      const o = data as Order;
      pushMessage({
        role: "agent",
        content: `Tracking ${o.order_number}:`,
        directive: { type: "ui_directive", version: 1, component: "FulfillmentTracker", props: { order: o }, correlation_id: `${uid}-${Date.now()}` },
        timestamp: new Date(),
      });
    }
  }

  if (view === "landing") {
    return <LandingPage onEnter={() => (window.location.href = "/auth")} />;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--color-bg)]">
      {/* ── Sidebar ── */}
      <aside
        className={`w-64 flex-shrink-0 bg-[var(--color-sidebar)] flex flex-col transition-transform duration-300 z-30
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          fixed inset-y-0 left-0
          lg:relative lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[var(--color-sidebar-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <Store size={16} className="text-white" />
            </div>
            <span className="font-[var(--font-display)] text-white font-semibold text-lg tracking-tight">Markto</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-agent)]/30 text-violet-300 font-semibold uppercase tracking-wide">AI</span>
          </div>
        </div>

        {/* Mode switch */}
        <div className="px-3 py-3 border-b border-[var(--color-sidebar-border)]">
          <div className="flex rounded-lg overflow-hidden bg-[var(--color-sidebar-surface)] p-0.5 gap-0.5">
            {(["agent", "classic"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setSidebarOpen(false); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === m ? "bg-[var(--color-primary)] text-white" : "text-white/50 hover:text-white/80"}`}
              >
                {m === "agent" ? <><Sparkles size={11} />Agent</> : <><LayoutDashboard size={11} />Classic</>}
              </button>
            ))}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          {mode === "agent" ? (
            <div className="space-y-0.5">
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">Agent Chat</p>
              <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/10 text-white text-sm font-medium">
                <MessageSquare size={14} /> Marketplace Assistant
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">Classic View</p>
              {([
                { tab: "catalog", label: "Browse Products", icon: <LayoutGrid size={14} /> },
                { tab: "orders", label: "My Orders", icon: <Package size={14} /> },
              ] as { tab: ClassicTab; label: string; icon: React.ReactNode }[]).map(({ tab, label, icon }) => (
                <button
                  key={tab}
                  onClick={() => { setClassicTab(tab); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${classicTab === tab && mode === "classic" ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white/80"}`}
                >
                  {icon}{label}
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* Connection status */}
        <div className="px-4 py-4 border-t border-[var(--color-sidebar-border)]">
          <button
            onClick={() => setConnected(c => !c)}
            className={`flex items-center gap-2 text-xs w-full ${connected ? "text-[var(--color-success-fg)]" : "text-[var(--color-danger-fg)]"}`}
          >
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span className="font-medium">{connected ? "Agent Gateway connected" : "Disconnected"}</span>
            <ArrowLeftRight size={10} className="ml-auto text-white/20" />
          </button>
          <p className="text-[10px] text-white/20 mt-1">Powered by Claude · MCP v1</p>
              <button onClick={() => setView("landing")} className="text-[10px] text-white/20 hover:text-white/50 mt-2 transition-colors text-left">← Back to landing page</button>
          {isAuthenticated && (
            <button
              onClick={() => {
                logout();
                setView("app");
              }}
              className="text-[10px] text-white/20 hover:text-[var(--color-danger-fg)] mt-2 transition-colors text-left flex items-center gap-1"
            >
              <LogOut size={10} /> Sign out
            </button>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex-shrink-0 bg-white border-b border-[var(--color-border)] flex items-center px-4 gap-3">
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setSidebarOpen(o => !o)}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-2">
            {mode === "agent" ? (
              <>
                <Zap size={15} className="text-[var(--color-agent)]" />
                <span className="font-semibold text-sm text-[var(--color-foreground)]">Agent Mode</span>
                <span className="text-xs text-[var(--color-muted)] hidden sm:block">· AI-driven generative UI</span>
              </>
            ) : (
              <>
                <LayoutDashboard size={15} className="text-[var(--color-primary)]" />
                <span className="font-semibold text-sm text-[var(--color-foreground)]">Classic View</span>
                <span className="text-xs text-[var(--color-muted)] hidden sm:block">· Direct REST API</span>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    logout();
                    setView("app");
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                  title="Sign out"
                >
                  <LogOut size={15} />
                </button>
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold"
                  title={user?.email ?? ""}
                >
                  {user?.first_name?.[0] ?? user?.email?.[0] ?? "U"}
                </div>
              </>
            ) : (
              <button
                onClick={() => (window.location.href = "/auth")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--color-primary)] hover:bg-blue-50 rounded-lg transition-colors border border-[var(--color-primary)]/20"
              >
                <UserIcon size={14} />
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Body */}
        {mode === "classic" ? (
          <div className="flex-1 overflow-y-auto">
            <div className="border-b border-[var(--color-border)] bg-white px-4">
              <div className="flex gap-0">
                {([
                  { tab: "catalog", label: "Browse Products", icon: <LayoutGrid size={13} /> },
                  { tab: "orders", label: "My Orders", icon: <Package size={13} /> },
                ] as { tab: ClassicTab; label: string; icon: React.ReactNode }[]).map(({ tab, label, icon }) => (
                  <button
                    key={tab}
                    onClick={() => setClassicTab(tab)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${classicTab === tab ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]"}`}
                  >
                    {icon}{label}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-w-5xl mx-auto">
              {classicTab === "catalog" ? <ClassicCatalog /> : <ClassicOrders />}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Canvas */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scroll-smooth">
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-3`}>
                    {msg.role === "agent" && (
                      <div className="w-8 h-8 rounded-full bg-[var(--color-agent)] flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles size={14} className="text-white" />
                      </div>
                    )}
                    <div className={`flex flex-col gap-2 max-w-full ${msg.role === "user" ? "items-end" : "items-start"} min-w-0`}>
                      {msg.content && (
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-md ${
                          msg.role === "user"
                            ? "bg-[var(--color-primary)] text-white rounded-tr-sm"
                            : "bg-white border border-[var(--color-border)] text-[var(--color-foreground)] rounded-tl-sm shadow-[var(--shadow-sm)]"
                        }`}>
                          {msg.content}
                        </div>
                      )}
                      {msg.directive && (
                        <div className="w-full max-w-2xl">
                          <DirectiveView directive={msg.directive} onAction={handleAction} />
                        </div>
                      )}
                      <span className="text-[10px] text-[var(--color-muted)]">
                        {msg.timestamp.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center shrink-0 mt-0.5 text-white text-xs font-bold">A</div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-agent)] flex items-center justify-center shrink-0">
                      <Sparkles size={14} className="text-white" />
                    </div>
                    <div className="px-4 py-3 bg-white border border-[var(--color-border)] rounded-2xl rounded-tl-sm shadow-[var(--shadow-sm)]">
                      <div className="flex gap-1 items-center h-4">
                        {[0,1,2].map(i => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted)] animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={canvasEnd} />
              </div>
            </div>

            {/* Suggestions */}
            <div className="px-4 pb-2">
              <div className="max-w-3xl mx-auto">
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => handleSend(s.label)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[var(--color-border)] text-xs font-medium text-[var(--color-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors shadow-[var(--shadow-sm)]"
                    >
                      {s.icon}{s.label} <ChevronRight size={10} className="text-[var(--color-muted)]" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-1">
              <div className="max-w-3xl mx-auto">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2 bg-white border border-[var(--color-border)] rounded-2xl px-4 py-2.5 shadow-[var(--shadow)] focus-within:border-[var(--color-primary)] transition-colors"
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything — browse products, check orders, view balance…"
                    className="flex-1 text-sm outline-none bg-transparent text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="w-8 h-8 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
