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
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";

import { ProductGrid, ProductGridSkeleton } from "./components/catalog/ProductGrid";
import { ProductCard } from "./components/catalog/ProductCard";
import { ProductDetail } from "./components/catalog/ProductDetail";
import { KBResultList, type KBSearchResult } from "./components/catalog/KBResultCard";
import { CartSummary } from "./components/cart/CartSummary";
import { OrderList } from "./components/orders/OrderList";
import { OrderConfirmation } from "./components/orders/OrderConfirmation";
import { MerchantBalanceCard } from "./components/merchant/MerchantBalanceCard";
import { LedgerTable } from "./components/merchant/LedgerTable";
import { FulfillmentTracker } from "./components/fulfillment/FulfillmentTracker";
import { ConfirmationDialog } from "./components/system/ConfirmationDialog";
import { SignInPrompt } from "./components/system/SignInPrompt";
import { ErrorMessage } from "./components/system/ErrorMessage";
import { AgentTranscript, AgentComposer } from "./components/system/AgentChatPanel";

import type { Product } from "./components/catalog/ProductCard";
import type {
  CartState,
  ProductGridDirectiveProps,
  ProductDetailDirectiveProps,
} from "./components/catalog/directives";
import type { Order } from "./components/orders/OrderList";
import type { CartSummaryProps, CartChange } from "./components/cart/CartSummary";
import type { LedgerEntry } from "./components/merchant/LedgerTable";
import type { UiDirective, CanvasMessage } from "./types/components";
import type { Product as BackendProduct } from "./lib/api/client";
import { apiClient } from "./lib/api/client";
import { agentGateway } from "./lib/agent-gateway";
import { cleanAgentText, dedupeDirectives } from "./lib/agent-turn";

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

function asProducts(v: unknown): Product[] {
  return Array.isArray(v)
    ? partitionResults(v as Array<Record<string, unknown>>).products
    : [];
}

/**
 * Renders an agent-emitted ui_directive into the matching registry
 * component. Props are narrowed defensively - on the directive-rendering
 * path we degrade to <ErrorMessage> rather than crash (no any here).
 *
 * Agent actions: view_product, add_to_cart ({ product, quantity }),
 * suggest (free-text follow-up), back, checkout, confirm, cancel.
 */
function RenderDirective({
  directive,
  onAction,
  cartState,
  readOnly,
}: {
  directive: UiDirective;
  onAction?: ActionHandler;
  cartState?: CartState;
  readOnly?: boolean;
}) {
  const props = directive.props;
  const addToCart = (p: Product, quantity = 1) =>
    onAction?.("add_to_cart", { product: p, quantity });
  const suggest = (text: string) => onAction?.("suggest", text);

  if (directive.component === "ProductGrid") {
    const gp = props as ProductGridDirectiveProps;
    const raw = Array.isArray(gp.items) ? gp.items : Array.isArray(gp.products) ? gp.products : [];
    const { products, docs } = partitionResults(raw as Array<Record<string, unknown>>);
    if (!products.length && !docs.length) {
      return <ProductGrid products={[]} query={gp.query} suggestions={gp.suggestions} onSuggest={suggest} />;
    }
    return (
      <div className="space-y-6">
        {products.length > 0 && (
          <ProductGrid
            products={products}
            query={gp.query}
            summary={gp.summary}
            sort={gp.sort}
            category={gp.category}
            suggestions={gp.suggestions}
            highlights={gp.highlights}
            cartState={cartState}
            onView={(p) => onAction?.("view_product", p)}
            onAddToCart={(p) => addToCart(p)}
            onSuggest={suggest}
          />
        )}
        {docs.length > 0 && (
          <KBResultList docs={docs} onViewProduct={(id) => onAction?.("view_product", id)} />
        )}
      </div>
    );
  }
  if (directive.component === "ProductCard") {
    const product = props.product as Product;
    return (
      <div className="max-w-[240px]">
        <ProductCard
          product={product}
          cartState={cartState?.[product.id]}
          onView={(p) => onAction?.("view_product", p)}
          onAddToCart={(p) => addToCart(p)}
        />
      </div>
    );
  }
  if (directive.component === "ProductDetail") {
    const dp = props as unknown as ProductDetailDirectiveProps;
    return (
      <ProductDetail
        product={dp}
        related={asProducts(dp.related)}
        cartState={cartState?.[dp.id]}
        onBack={() => onAction?.("back")}
        onAddToCart={(p, qty) => addToCart(p, qty)}
        onView={(p) => onAction?.("view_product", p)}
        onSuggest={suggest}
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((cat) => (
          <button
            key={cat.id ?? cat.slug ?? cat.name}
            type="button"
            onClick={() => onAction?.("suggest", `Show me ${cat.name} products`)}
            className="flex min-h-16 flex-col items-start justify-center gap-0.5 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-left transition-colors hover:border-[var(--color-primary)]"
          >
            <span className="text-sm font-medium">{cat.name}</span>
            {cat.product_count != null && (
              <span className="text-xs text-[var(--color-muted)]">
                {cat.product_count} item{cat.product_count === 1 ? "" : "s"}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }
  if (directive.component === "CartSummary") {
    const cart = props as unknown as CartSummaryProps;
    return (
      <CartSummary
        {...cart}
        readOnly={readOnly}
        onCheckout={() => onAction?.("checkout")}
        onUpdateItems={(changes) => onAction?.("update_cart", changes)}
      />
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

const STARTER_PROMPTS = [
  "Show me what's popular",
  "Find something under ₦50,000",
  "What categories do you have?",
];

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
  // Add-to-cart feedback per product id, and the latest known cart size.
  const [cartState, setCartState] = useState<CartState>({});
  const [cartCount, setCartCount] = useState<number | null>(null);

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

  // ---- Turn handling -------------------------------------------------
  // A turn = one user message and the agent's whole answer. Within a turn:
  //   1. text streams live into ONE bubble (coalesced to one render per frame),
  //   2. directives (results) are HELD, never shown mid-stream,
  //   3. when the stream ends everything is committed in one batch, text first,
  //      then the results, so the summary always precedes the results,
  //   4. the whole UI stays locked (searching = true) until that commit.
  const activeRef = useRef(false); // a turn is in flight; events are accepted
  const busyRef = useRef(false); // mirror of `searching`, readable from any closure
  const heldRef = useRef<UiDirective[]>([]);
  const errorRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastEventRef = useRef(0);
  const cartIntentRef = useRef(false); // this turn is about the cart: show only the cart
  const addedProductRef = useRef<string | null>(null); // product just added, to highlight its line
  const [pendingKinds, setPendingKinds] = useState<string[]>([]);

  function touch() {
    lastEventRef.current = Date.now();
  }
  function scheduleTextFlush() {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setStatusText(cleanAgentText(textBufferRef.current) || null);
    });
  }

  function finishTurn() {
    if (!activeRef.current) return;
    activeRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const text = cleanAgentText(textBufferRef.current).trim();
    const error = errorRef.current;
    const cartIntent = cartIntentRef.current;
    const addedId = addedProductRef.current;
    const directives = dedupeDirectives(heldRef.current, text.length > 0, { cartIntent }).map((d) =>
      cartIntent && addedId && d.component === "CartSummary"
        ? ({ ...d, props: { ...d.props, highlight_product_id: addedId } } as UiDirective)
        : d,
    );
    textBufferRef.current = "";
    heldRef.current = [];
    errorRef.current = null;

    const batch: Array<Partial<CanvasMessage>> = [];
    if (text) batch.push({ content: text });
    for (const d of directives) {
      batch.push({ directive: d });
      if (d.component === "CartSummary") {
        const n = Number((d.props as Record<string, unknown>).item_count);
        if (Number.isFinite(n)) setCartCount(n);
        settleCart("added");
      }
    }
    if (error && error !== text) batch.push({ content: error });
    if (!batch.length) batch.push({ content: "I didn't get a response. Please try again." });

    const msgs = batch.map(
      (m) =>
        ({
          id: String(++chatIdRef.current),
          role: "agent",
          timestamp: new Date(),
          ...m,
        }) as CanvasMessage,
    );
    setChatMessages((prev) => [...prev, ...msgs]); // one update = one render
    setStatusText(null);
    setPendingKinds([]);
    busyRef.current = false;
    cartIntentRef.current = false;
    addedProductRef.current = null;
    setSearching(false);
    settleCart("clear");
  }

  useEffect(() => {
    const stored = agentGateway.getStoredSessionId();
    agentGateway.connect(stored ?? undefined);
    agentGateway.setHandlers({
      onSession: () => {
        touch();
        setAgentConnected(true);
      },
      onText: (content) => {
        if (!activeRef.current || !content) return;
        touch();
        textBufferRef.current += content;
        scheduleTextFlush();
      },
      onDirective: (directive) => {
        if (!activeRef.current) return;
        touch();
        heldRef.current.push(directive);
        setPendingKinds(heldRef.current.map((d) => d.component));
      },
      onError: (error) => {
        if (!activeRef.current) return;
        touch();
        errorRef.current = error;
      },
      onEnd: () => finishTurn(),
    });
    // Never leave the UI locked if a stream stalls.
    const watchdog = window.setInterval(() => {
      if (activeRef.current && Date.now() - lastEventRef.current > 60_000) {
        errorRef.current = errorRef.current ?? "The agent took too long to respond. Please try again.";
        finishTurn();
      }
    }, 5000);
    return () => {
      window.clearInterval(watchdog);
      agentGateway.disconnect();
    };
  }, []);

  function sendToAgent(
    text: string,
    confirmedToken?: string,
    opts?: { cart?: boolean; addedProductId?: string },
  ) {
    if (busyRef.current) return; // locked while the agent is responding
    if (!agentGateway.isConnected()) {
      settleCart("clear");
      pushChat({ role: "agent", content: "The assistant is offline right now. Please try again shortly." });
      return;
    }
    cartIntentRef.current = !!opts?.cart;
    addedProductRef.current = opts?.addedProductId ?? null;
    busyRef.current = true;
    activeRef.current = true;
    touch();
    textBufferRef.current = "";
    heldRef.current = [];
    errorRef.current = null;
    setPendingKinds([]);
    setStatusText(null);
    setSearching(true);
    addUserMessage(text);
    void agentGateway.sendMessage(text, confirmedToken);
  }

  function handleChatSubmit(q: string) {
    const trimmed = q.trim();
    if (trimmed) sendToAgent(trimmed);
  }

  function handleClear() {
    if (busyRef.current) return;
    setChatMessages([]);
    chatIdRef.current = 0;
    setStatusText(null);
    setCartState({});
    textBufferRef.current = "";
  }

  // Cart feedback: a CartSummary directive confirms the add; anything else
  // (error, sign-in, end of turn) returns the button to idle without claiming success.
  function settleCart(outcome: "added" | "clear") {
    setCartState((prev) => {
      const next: CartState = {};
      for (const [id, s] of Object.entries(prev)) {
        if (s === "added" || (s === "adding" && outcome === "added")) next[id] = "added";
      }
      return next;
    });
    if (outcome === "added") {
      window.setTimeout(
        () =>
          setCartState((prev) =>
            Object.fromEntries(Object.entries(prev).filter(([, s]) => s !== "added")),
          ),
        2500,
      );
    }
  }

  function handleViewProduct(p: Product) {
    if (busyRef.current) return;
    // Related products: same category or same merchant, from the loaded catalog.
    const related = browseProducts
      .filter(
        (x) =>
          x.id !== p.id &&
          ((p.category_name && x.category_name === p.category_name) ||
            x.merchant_id === p.merchant_id),
      )
      .slice(0, 4);
    pushChat({
      role: "agent",
      directive: {
        type: "ui_directive",
        version: 1,
        component: "ProductDetail",
        props: { ...p, related } as unknown as Record<string, unknown>,
        correlation_id: `local-${chatIdRef.current + 1}`,
      } as UiDirective,
    });
  }

  function handleAddToCart(p: Product, quantity = 1) {
    if (busyRef.current) return;
    setCartState((prev) => ({ ...prev, [p.id]: "adding" }));
    // After an add the next step is choosing the quantity, so the turn shows the cart, not product details.
    sendToAgent(
      quantity > 1 ? `Add ${quantity} of ${p.name} to my cart` : `Add ${p.name} to my cart`,
      undefined,
      { cart: true, addedProductId: p.id },
    );
  }

  // Quantities are absolute (idempotent): "set to N", and 0 removes the line.
  function handleCartUpdate(changes: CartChange[]) {
    if (busyRef.current || changes.length === 0) return;
    const parts = changes.map((c) =>
      c.quantity === 0
        ? `remove "${c.product_name}" (variant ${c.variant_id})`
        : `set "${c.product_name}" (variant ${c.variant_id}) to quantity ${c.quantity}`,
    );
    sendToAgent(`Update my cart: ${parts.join("; ")}.`, undefined, { cart: true });
  }

  function scrollToResults() {
    const grids = chatMessages.filter((m) => m.directive?.component === "ProductGrid");
    const last = grids[grids.length - 1];
    document
      .getElementById(last ? `msg-${last.id}` : "browse")
      ?.scrollIntoView({ block: "start" });
  }

  function handleAction(action: string, data?: unknown) {
    if (busyRef.current && action !== "cancel") return; // locked while the agent responds
    if (action === "view_product") {
      if (typeof data === "string") {
        // Open instantly from the loaded catalog when we can; else ask the agent.
        const local = browseProducts.find((x) => x.id === data);
        if (local) handleViewProduct(local);
        else sendToAgent(`Show me details for product ${data}`);
      } else {
        handleViewProduct(data as Product);
      }
    } else if (action === "add_to_cart") {
      const d = data as { product: Product; quantity?: number };
      handleAddToCart(d.product, d.quantity ?? 1);
    } else if (action === "update_cart") {
      handleCartUpdate(data as CartChange[]);
    } else if (action === "suggest") {
      sendToAgent(String(data));
    } else if (action === "back") {
      scrollToResults();
    } else if (action === "checkout") {
      sendToAgent("checkout please");
    } else if (action === "track_order") {
      // directive already rendered in chat
    } else if (action === "confirm") {
      sendToAgent("Confirmed", data as string | undefined);
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
            <button
              type="button"
              onClick={() => sendToAgent("Show my cart", undefined, { cart: true })}
              disabled={searching}
              aria-label={cartCount ? `Cart, ${cartCount} items` : "Cart"}
              className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
            >
              <ShoppingBag size={18} />
              <span className="hidden sm:inline">Cart</span>
              {!!cartCount && (
                <span className="min-w-[20px] rounded-full bg-[var(--color-primary)] px-1.5 text-center text-[11px] font-semibold leading-5 text-white">
                  {cartCount}
                </span>
              )}
            </button>
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

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
        <AgentTranscript
          messages={chatMessages}
          starters={STARTER_PROMPTS}
          onSend={handleChatSubmit}
          onClear={handleClear}
          isSearching={searching}
          statusText={statusText}
          pendingKinds={pendingKinds}
          renderDirective={(d, meta) => (
            <RenderDirective directive={d} onAction={handleAction} cartState={cartState} readOnly={!meta.isLatest} />
          )}
        />

        <section
          id="browse"
          {...(searching ? ({ inert: "" } as Record<string, string>) : {})}
          className={"mt-10 scroll-mt-20 transition-opacity duration-200 " + (searching ? "opacity-70" : "")}
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Browse all products</h2>
            <p className="text-sm text-[var(--color-muted)]">
              Sort and filter here, or ask the agent to narrow it down.
            </p>
          </div>
          {browseLoading ? (
            <ProductGridSkeleton count={10} />
          ) : browseError ? (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-6 text-sm text-[var(--color-muted)]">
              <Package size={18} />
              <span>{browseError}</span>
              <button
                onClick={loadProducts}
                className="h-9 rounded-lg bg-[var(--color-primary)] px-4 font-medium text-white hover:bg-[var(--color-primary-hover)]"
              >
                Try again
              </button>
            </div>
          ) : (
            <ProductGrid
              products={browseProducts}
              cartState={cartState}
              onView={handleViewProduct}
              onAddToCart={(p) => handleAddToCart(p)}
            />
          )}
        </section>

        <AgentComposer
          placeholder="Search products or ask the agent…"
          onSend={handleChatSubmit}
          isSearching={searching}
        />
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