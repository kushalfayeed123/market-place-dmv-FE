"use client";

import {
  useState,
  useEffect,
  useRef,
  type ComponentProps,
} from "react";
import {
    Store,
  LogIn,
  LogOut,
  Package,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";

import { ProductGrid } from "./components/catalog/ProductGrid";
import { ProductCard } from "./components/catalog/ProductCard";
import { ProductDetail } from "./components/catalog/ProductDetail";
import { KBResultCard, type KBSearchResult } from "./components/catalog/KBResultCard";
import { CartSummary } from "./components/cart/CartSummary";
import { OrderList } from "./components/orders/OrderList";
import { OrderConfirmation } from "./components/orders/OrderConfirmation";
import { MerchantBalanceCard } from "./components/merchant/MerchantBalanceCard";
import { LedgerTable } from "./components/merchant/LedgerTable";
import { FulfillmentTracker } from "./components/fulfillment/FulfillmentTracker";
import { ConfirmationDialog } from "./components/system/ConfirmationDialog";
import { SignInPrompt } from "./components/system/SignInPrompt";
import { ErrorMessage } from "./components/system/ErrorMessage";
import { AgentChatPanel } from "./components/system/AgentChatPanel";

import type { Product } from "./components/catalog/ProductCard";
import type { Order } from "./components/orders/OrderList";
import type { CartSummaryProps } from "./components/cart/CartSummary";
import type { LedgerEntry } from "./components/merchant/LedgerTable";
import type { UiDirective, CanvasMessage } from "./types/components";
import type { Product as BackendProduct } from "./lib/api/client";
import { apiClient } from "./lib/api/client";
import { agentGateway } from "./lib/agent-gateway";

// Backend -> UI view-model mappers

/**
 * Catalog view-model. The backend /api/v1/catalog/products endpoint
 * returns merchant_id/store_id; the catalog UI shows a human-readable
 * placeholder name until the backend joins the store/merchant name.
 */
type CatalogProduct = Product & {
  description?: string;
  store_name?: string;
  store_id?: string;
};

function toUiProduct(p: BackendProduct): CatalogProduct {
  return {
    id: p.id,
    name: p.title,
    merchant_id: p.merchant_id,
    store_id: p.store_id,
    merchant_name: `Merchant #${p.merchant_id.slice(0, 8)}`,
    store_name: `Store #${p.store_id.slice(0, 8)}`,
    price: { amount: p.base_price_amount, currency: p.base_price_currency },
    status: p.status,
    description: p.description ?? undefined,
    urls: p.urls?.length ? p.urls : undefined,
    image_url: p.urls?.[0] ?? undefined,
  };
}

/**
 * The agent emits props.items for BOTH semantic_search (raw knowledge-base
 * documents with text + metadata) and search_products (real product DTOs
 * with name + price). Split them so KB hits render as snippet cards and
 * product DTOs render as ProductCards - never the two mixed in one grid.
 */
function partitionResults(
  items: Array<Record<string, unknown>>,
): { products: Product[]; docs: KBSearchResult[] } {
  const products: Product[] = [];
  const docs: KBSearchResult[] = [];
  for (const it of items) {
    if (!it) continue;
    if (typeof it.text === "string" && typeof it.name !== "string") {
      docs.push(it as unknown as KBSearchResult);
    } else if (typeof it.name === "string") {
      products.push(it as unknown as Product);
    }
  }
  return { products, docs };
}

type ActionHandler = (action: string, data?: unknown) => void;

/**
 * Renders an agent-emitted ui_directive into the matching registry
 * component. Props are narrowed defensively - on the directive-rendering
 * path we degrade to <ErrorMessage> rather than crash (per project
 * conventions: no any on this path).
 */
function RenderDirective({
  directive,
  onAction,
}: {
  directive: UiDirective;
  onAction?: ActionHandler;
}) {
  const props = directive.props;

  if (directive.component === "ProductGrid") {
    const raw = Array.isArray(props.items)
      ? (props.items as Array<Record<string, unknown>>)
      : Array.isArray(props.products)
      ? (props.products as Array<Record<string, unknown>>)
      : [];
    const { products, docs } = partitionResults(raw);
    if (docs.length) {
      return (
        <div className="space-y-3">
          {docs.map((doc) => (
            <KBResultCard
              key={doc.id ?? doc.text?.slice(0, 24) ?? "kb"}
              doc={doc}
              onViewProduct={(id) => onAction?.("view_product", id)}
            />
          ))}
        </div>
      );
    }
    if (products.length) {
      return (
        <ProductGrid
          products={products}
          query={props.query as string | undefined}
          onView={(p) => onAction?.("view_product", p)}
          onAddToCart={(p) => onAction?.("add_to_cart", p)}
            />
      );
    }
    return <ErrorMessage message="No results to display." />;
  }
  if (directive.component === "ProductCard") {
    return <ProductCard product={props.product as Product} />;
  }
    if (directive.component === "ProductDetail") {
    return (
      <ProductDetail
        product={props as unknown as (Product & { description?: string })}
        onAddToCart={(p) => onAction?.("add_to_cart", p)}
      />
    );
  }
  if (directive.component === "CategoryList") {
    const items = Array.isArray(props.items)
      ? (props.items as Array<{
          id: string;
          name: string;
          slug?: string;
          product_count?: number | null;
        }>)
      : [];
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((cat) => (
          <div
            key={cat.id ?? cat.slug ?? cat.name}
            className="flex flex-col items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-center">
            <span className="text-sm font-medium">{cat.name}</span>
            {cat.product_count != null && (
              <span className="text-xs text-[var(--color-muted)]">
                {cat.product_count} item{cat.product_count === 1 ? "" : "s"}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }
  if (directive.component === "CartSummary") {
    const cart = props as unknown as CartSummaryProps;
    return (
      <CartSummary {...cart} onCheckout={() => onAction?.("checkout")} />
    );
  }
  if (directive.component === "OrderList") {
    return (
      <OrderList
        orders={
          Array.isArray(props.orders)
            ? (props.orders as Order[])
            : []
        }
        onTrack={(o) => onAction?.("track_order", o)}
            />
    );
  }
  if (directive.component === "OrderConfirmation") {
    return <OrderConfirmation order={props.order as Order} />;
  }
  if (directive.component === "FulfillmentTracker") {
    return (
      <FulfillmentTracker
        order={
          props.order as {
            id: string;
            order_number: string;
            status: string;
            merchant_name: string;
          }
        }
            />
    );
  }
  if (directive.component === "MerchantBalanceCard") {
    const merchant = props as unknown as ComponentProps<
      typeof MerchantBalanceCard
    >;
    return <MerchantBalanceCard {...merchant} />;
  }
  if (directive.component === "LedgerTable") {
    return (
      <LedgerTable
        entries={
          Array.isArray(props.entries)
            ? (props.entries as LedgerEntry[])
            : []
        }
            />
    );
  }
  if (directive.component === "ConfirmationDialog") {
    const cprops = props as ComponentProps<typeof ConfirmationDialog> & {
      confirmed_token?: string;
    };
    return (
      <ConfirmationDialog
        title={cprops.title}
        message={cprops.message}
        tool_name={cprops.tool_name}
        onConfirm={() =>
          onAction?.("confirm", cprops.confirmed_token ?? cprops.tool_name)
        }
        onCancel={() => onAction?.("cancel")}
            />
    );
  }
  if (directive.component === "SignInPrompt") {
    const auth = props as unknown as ComponentProps<typeof SignInPrompt>;
    return <SignInPrompt {...auth} />;
  }
  if (directive.component === "ErrorMessage") {
    const err = props as unknown as ComponentProps<typeof ErrorMessage>;
    return <ErrorMessage {...err} />;
  }
  return (
    <ErrorMessage message={`Unknown component: ${directive.component}`} />
  );
}

// ////////////////////////////////////////////////
// Product listing page (the app entry point at "/")
// ////////////////////////////////////////////////
//
// There is no "agent / classic" mode toggle on this page - product
// browsing is always available via the REST catalog, and searching is
// always delegated to the agent (POST /sse). The full grid is shown so
// users can browse a lot of products at once; agent search results are
// rendered in their own section above the browse grid.

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();

  // Browse - display a lot of products at once (REST catalog).
  const [browseProducts, setBrowseProducts] = useState<CatalogProduct[]>([]);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [browseError, setBrowseError] = useState<string | null>(null);

  // Agent interaction state
  const [searching, setSearching] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [agentConnected, setAgentConnected] = useState(false);

  // -- Persistent agent chat transcript
  // Keeps every user message + agent reply (text and directives) so the
  // conversation stays visible while products are browsed.
  const [chatMessages, setChatMessages] = useState<CanvasMessage[]>([]);
  // Monotonic id for transcript entries (persists across turns within a session).
  const chatIdRef = useRef(0);
  function pushChat(msg: Partial<CanvasMessage>) {
    const id = String(++chatIdRef.current);
    setChatMessages((prev) => [...prev, {
      id, role: "agent", timestamp: new Date(), ...msg,
    } as CanvasMessage]);
  }
  function addUserMessage(content: string) {
    const id = String(++chatIdRef.current);
    setChatMessages((prev) =>
      [...prev, { id, role: "user", content, timestamp: new Date() }],
    );
  }

  const textBufferRef = useRef<string>("");

  const loadProducts = () => {
    setBrowseLoading(true);
    setBrowseError(null);
    apiClient
      .getProducts()
      .then((data) => {
        setBrowseProducts(data.map(toUiProduct));
        setBrowseError(null);
      })
      .catch(() => setBrowseError("Could not load products."))
      .finally(() => setBrowseLoading(false));
  };

  useEffect(() => { loadProducts(); }, []);

  useEffect(() => {
    const stored = agentGateway.getStoredSessionId();
    agentGateway.connect(stored ?? undefined);
    agentGateway.setHandlers({
      onSession: () => {
        textBufferRef.current = "";
        setStatusText(null);
        setAgentConnected(true);
      },
      onText: (content) => {
        if (content) {
          textBufferRef.current = (textBufferRef.current ?? "") + content;
        }
        setStatusText(textBufferRef.current || null);
      },
      onDirective: (directive) => {
        setSearching(false);
        // Skip ProductGrid directives that carry no items — the agent may
        // emit an empty semantic_search result before a populated search_products
        // result. Showing "No results" for the intermediate one is confusing.
        if (directive.component === "ProductGrid") {
          const raw = Array.isArray(directive.props.items)
            ? directive.props.items
            : Array.isArray(directive.props.products)
              ? directive.props.products
              : [];
          if (!Array.isArray(raw) || raw.length === 0) return;
        }
        pushChat({ role: "agent", directive });
      },
      onError: (error) => {
        setSearching(false);
        setStatusText(error);
        if (textBufferRef.current) {
          pushChat({ role: "agent", content: textBufferRef.current });
          textBufferRef.current = "";
        }
        pushChat({ role: "agent", content: error });
      },
      onEnd: () => {
        setSearching(false);
        if (textBufferRef.current) {
          pushChat({ role: "agent", content: textBufferRef.current });
          textBufferRef.current = "";
        }
      },
    });
    return () => agentGateway.disconnect();
  }, []);

  function handleChatSubmit(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSearching(true);
    textBufferRef.current = "";
    setStatusText(null);
        addUserMessage(trimmed);
    agentGateway.sendMessage(trimmed);
  }

  function handleClear() {
    setChatMessages([]);
    chatIdRef.current = 0;
    setSearching(false);
    setStatusText(null);
    textBufferRef.current = "";
  }

  function handleViewProduct(p: Product) {
    pushChat({
      role: "agent",
      directive: {
        type: "ui_directive",
        version: 1,
        component: "ProductDetail",
        props: p as unknown as Record<string, unknown>,
        correlation_id: `local-${chatIdRef.current + 1}`,
      } as UiDirective,
    });
  }

  function handleAddToCart(p: Product) {
    addUserMessage(`Add ${p.name} to my cart`);
    agentGateway.sendMessage(`Add ${p.name} to my cart`);
  }

  function handleAction(action: string, data?: unknown) {
    if (action === "view_product") {
      if (typeof data === "string") {
        addUserMessage(`Show me details for product ${data}`);
        agentGateway.sendMessage(`Show me details for product ${data}`);
        setSearching(true);
      } else {
        handleViewProduct(data as Product);
      }
    } else if (action === "add_to_cart") {
      addUserMessage(`Add ${(data as Product).name} to my cart`);
      agentGateway.sendMessage(`Add ${(data as Product).name} to my cart`);
    } else if (action === "checkout") {
      addUserMessage("checkout please");
      agentGateway.sendMessage("checkout please");
    } else if (action === "track_order") {
      // directive already rendered in chat
    } else if (action === "confirm") {
      addUserMessage("Confirmed");
      agentGateway.sendMessage("Confirmed", data as string | undefined);
    } else if (action === "cancel") {
      setStatusText(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-foreground)]">
      {/* Header: brand + nav (no duplicate search bar) */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <Store size={16} className="text-white" />
            </div>
            <a href="/" className="font-[var(--font-display)] text-xl font-semibold">
              MARKTO
            </a>
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-agent)]/20 text-[var(--color-agent)] font-semibold uppercase tracking-wide">
              AI
            </span>
          </div>
          {/* <a
            href="/landing"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
          >
            Marketing site
          </a> */}
          <nav className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
              <span
                className={
                  "w-2 h-2 rounded-full " +
                                    (agentConnected ? "bg-green-400" : "bg-red-400")
                }
            />
              <span className="hidden sm:inline">
                Agent {agentConnected ? "online" : "offline"}
              </span>
            </span>
            {isAuthenticated && (user?.role === "merchant_owner" || user?.role === "merchant_staff") && (
              <a
                href="/merchant/dashboard"
                className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors"
              >
                <LayoutDashboard size={14} />
                Merchant Dashboard
              </a>
            )}
            {isAuthenticated ? (
              <button
                onClick={() => logout().catch(() => {})}
                className="flex items-center gap-1.5 text-xs text-[var(--color-foreground)] hover:text-[var(--color-primary)]"
              >
                <LogOut size={14} />{" "}
                <span>{user?.first_name ?? "Account"}</span>
              </button>
            ) : (
              <a
                href="/auth"
                className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary)] hover:underline"
              >
                <LogIn size={14} /> Sign in
              </a>
            )}
          </nav>
        </div>

      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-6">
        {/* Chat panel - starts minimal (input only) and expands as
            the conversation grows. Never fixed at the bottom. */}
                <AgentChatPanel
          messages={chatMessages}
          inputPlaceholder="Search products, ask questions..."
          onSend={handleChatSubmit}
          onClear={handleClear}
          isSearching={searching}
          statusText={statusText}
          renderDirective={(d) => (
            <RenderDirective directive={d} onAction={handleAction} />
          )}
        />
        {/* Browse all products (always visible below the chat) */}
        <section className="mt-4">
          <h2 className="text-lg font-semibold mb-3">All products</h2>
          {browseLoading ? (
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] bg-gray-100 rounded-xl animate-pulse mb-3 break-inside-avoid"
                />
              ))}
            </div>
          ) : browseError ? (
            <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <Package size={16} />
              <span>{browseError}</span>
              <button
                onClick={loadProducts}
                className="underline text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
              >
                Retry
              </button>
            </div>
          ) : (
            <ProductGrid
              products={browseProducts}
              onView={handleViewProduct}
              onAddToCart={handleAddToCart}
            />
          )}
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-5 sm:px-8 py-6 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-muted)]">
        <span>&copy; {new Date().getFullYear()} Markto. </span>
        <a
          href="/landing"
          className="underline hover:text-[var(--color-foreground)]"
        >
          Marketing site
        </a>
      </footer>
    </div>
  );
}